import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { commentVotes, comments as commentsTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getStory, getComments } from "@/lib/queries";
import { Tag } from "@/components/Tag";
import { Voter } from "@/components/Voter";
import { CommentTree } from "@/components/CommentTree";
import { Markdown } from "@/components/Markdown";
import { ago, isNewUser } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ shortId: string; slug: string }>;
}) {
  const [{ shortId }, user] = await Promise.all([params, getCurrentUser()]);
  const story = await getStory(shortId, user?.id);
  if (!story) notFound();

  const commentTree = await getComments(story.id);

  // viewer's comment votes for this story
  let votedIds: number[] = [];
  if (user) {
    const ids = await db
      .select({ id: commentsTable.id })
      .from(commentsTable)
      .where(eq(commentsTable.storyId, story.id))
      .all();
    const idList = ids.map((r) => r.id);
    if (idList.length) {
      const votes = await db
        .select({ commentId: commentVotes.commentId })
        .from(commentVotes)
        .where(
          and(
            eq(commentVotes.userId, user.id),
            inArray(commentVotes.commentId, idList),
          ),
        )
        .all();
      votedIds = votes.map((v) => v.commentId);
    }
  }

  const isText = !story.url;
  const href = story.url ?? "#";

  return (
    <main>
      <div className="story" style={{ marginBottom: "0.5rem" }}>
        <Voter
          kind="story"
          id={story.id}
          initialVoted={story.voted}
          initialScore={story.upvotes}
          loggedIn={!!user}
        />
        <div className="details">
          <span className="link" style={{ fontSize: "1.15rem" }}>
            {isText ? (
              <span>{story.title}</span>
            ) : (
              <a className="u-url" href={href}>
                {story.title}
              </a>
            )}
          </span>
          {story.tags.map((t) => (
            <Tag key={t.name} tag={t} />
          ))}
          {story.domain && <span className="domain">{story.domain}</span>}
          <div className="byline">
            {isText ? "authored by" : "via"}{" "}
            <Link
              href={`/u/${story.author.username}`}
              className={`u-author ${isNewUser(story.author.createdAt) ? "newuser" : ""}`}
            >
              {story.author.username}
            </Link>{" "}
            {ago(story.createdAt)}
            <span className="tagline-sep">|</span>
            {story.commentCount} comment{story.commentCount === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      {story.description && (
        <div className="box" style={{ marginLeft: "2.2rem" }}>
          <Markdown text={story.description} />
        </div>
      )}

      <CommentTree
        comments={commentTree}
        storyId={story.id}
        loggedIn={!!user}
        votedIds={votedIds}
      />
    </main>
  );
}
