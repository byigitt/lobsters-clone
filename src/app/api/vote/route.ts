import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  storyVotes,
  commentVotes,
  stories,
  comments,
  users,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { calcHotness } from "@/lib/hotness";
import { isPositiveInt } from "@/lib/validate";
import { rateLimit } from "@/lib/ratelimit";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Throttle: at most 60 votes per minute per user.
  const limit = rateLimit(`vote:${user.id}`, 60, 60_000);
  if (!limit.ok)
    return NextResponse.json(
      { error: "rate limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { kind, id } = (payload ?? {}) as Record<string, unknown>;
  if ((kind !== "story" && kind !== "comment") || !isPositiveInt(id))
    return NextResponse.json({ error: "bad request" }, { status: 400 });

  if (kind === "story") {
    const [existing, story] = await Promise.all([
      db
        .select()
        .from(storyVotes)
        .where(and(eq(storyVotes.userId, user.id), eq(storyVotes.storyId, id)))
        .get(),
      db.select().from(stories).where(eq(stories.id, id)).get(),
    ]);
    if (!story)
      return NextResponse.json({ error: "not found" }, { status: 404 });

    let voted: boolean;
    let delta: number;
    if (existing) {
      await db
        .delete(storyVotes)
        .where(and(eq(storyVotes.userId, user.id), eq(storyVotes.storyId, id)))
        .run();
      voted = false;
      delta = -1;
    } else {
      await db.insert(storyVotes).values({ userId: user.id, storyId: id }).run();
      voted = true;
      delta = 1;
    }
    const newUp = story.upvotes + delta;
    await db
      .update(stories)
      .set({
        upvotes: newUp,
        hotness: calcHotness(newUp, story.commentCount, story.createdAt),
      })
      .where(eq(stories.id, id))
      .run();
    // author karma
    if (story.userId !== user.id)
      await db
        .update(users)
        .set({ karma: sql`${users.karma} + ${delta}` })
        .where(eq(users.id, story.userId))
        .run();
    return NextResponse.json({ voted, score: newUp });
  }

  // comment
  const [existing, comment] = await Promise.all([
    db
      .select()
      .from(commentVotes)
      .where(and(eq(commentVotes.userId, user.id), eq(commentVotes.commentId, id)))
      .get(),
    db.select().from(comments).where(eq(comments.id, id)).get(),
  ]);
  if (!comment)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  let voted: boolean;
  let delta: number;
  if (existing) {
    await db
      .delete(commentVotes)
      .where(
        and(eq(commentVotes.userId, user.id), eq(commentVotes.commentId, id)),
      )
      .run();
    voted = false;
    delta = -1;
  } else {
    await db
      .insert(commentVotes)
      .values({ userId: user.id, commentId: id })
      .run();
    voted = true;
    delta = 1;
  }
  const newUp = comment.upvotes + delta;
  await db
    .update(comments)
    .set({ upvotes: newUp })
    .where(eq(comments.id, id))
    .run();
  if (comment.userId !== user.id)
    await db
      .update(users)
      .set({ karma: sql`${users.karma} + ${delta}` })
      .where(eq(users.id, comment.userId))
      .run();
  return NextResponse.json({ voted, score: newUp });
}
