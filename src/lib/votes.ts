import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { storyVotes, commentVotes, stories, comments, users } from "@/db/schema";
import { calcHotness } from "@/lib/hotness";

export type VoteResult = { voted: boolean; score: number } | null;

async function bumpAuthorKarma(authorId: number, voterId: number, delta: number) {
  if (authorId === voterId) return;
  await db
    .update(users)
    .set({ karma: sql`${users.karma} + ${delta}` })
    .where(eq(users.id, authorId))
    .run();
}

export async function toggleStoryVote(
  userId: number,
  storyId: number,
): Promise<VoteResult> {
  const where = and(eq(storyVotes.userId, userId), eq(storyVotes.storyId, storyId));
  const [existing, story] = await Promise.all([
    db.select().from(storyVotes).where(where).get(),
    db.select().from(stories).where(eq(stories.id, storyId)).get(),
  ]);
  if (!story) return null;

  const delta = existing ? -1 : 1;
  if (existing) {
    await db.delete(storyVotes).where(where).run();
  } else {
    await db.insert(storyVotes).values({ userId, storyId }).run();
  }

  const newUp = story.upvotes + delta;
  await db
    .update(stories)
    .set({
      upvotes: newUp,
      hotness: calcHotness(newUp, story.commentCount, story.createdAt),
    })
    .where(eq(stories.id, storyId))
    .run();
  await bumpAuthorKarma(story.userId, userId, delta);
  return { voted: !existing, score: newUp };
}

export async function toggleCommentVote(
  userId: number,
  commentId: number,
): Promise<VoteResult> {
  const where = and(
    eq(commentVotes.userId, userId),
    eq(commentVotes.commentId, commentId),
  );
  const [existing, comment] = await Promise.all([
    db.select().from(commentVotes).where(where).get(),
    db.select().from(comments).where(eq(comments.id, commentId)).get(),
  ]);
  if (!comment) return null;

  const delta = existing ? -1 : 1;
  if (existing) {
    await db.delete(commentVotes).where(where).run();
  } else {
    await db.insert(commentVotes).values({ userId, commentId }).run();
  }

  const newUp = comment.upvotes + delta;
  await db
    .update(comments)
    .set({ upvotes: newUp })
    .where(eq(comments.id, commentId))
    .run();
  await bumpAuthorKarma(comment.userId, userId, delta);
  return { voted: !existing, score: newUp };
}
