import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, users, stories } from "@/db/schema";
import { ago } from "@/lib/time";
import { Markdown } from "@/components/Markdown";
import { AuthorLink } from "@/components/AuthorLink";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "Comments",
  "The latest comments across all discussions.",
);
export const dynamic = "force-dynamic";

export default async function CommentsPage() {
  const rows = await db
    .select({
      id: comments.id,
      shortId: comments.shortId,
      body: comments.body,
      createdAt: comments.createdAt,
      upvotes: comments.upvotes,
      authorName: users.username,
      authorCreated: users.createdAt,
      storyTitle: stories.title,
      storyShort: stories.shortId,
      storySlug: stories.slug,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .innerJoin(stories, eq(comments.storyId, stories.id))
    .orderBy(desc(comments.createdAt))
    .limit(40)
    .all();

  return (
    <main>
      <h1 className="page-title">Recent Comments</h1>
      <ul className="comments">
        {rows.map((c) => (
          <li className="comment" key={c.id}>
            <div className="byline">
              <AuthorLink username={c.authorName} createdAt={c.authorCreated} />{" "}
              {ago(c.createdAt)} on{" "}
              <Link href={`/s/${c.storyShort}/${c.storySlug}`}>
                {c.storyTitle}
              </Link>
            </div>
            <div className="body">
              <Markdown text={c.body} />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
