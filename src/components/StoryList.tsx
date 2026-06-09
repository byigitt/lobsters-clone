import Link from "next/link";
import type { StoryListItem } from "@/lib/queries";
import { Tag } from "./Tag";
import { Voter } from "./Voter";
import { ago, isNewUser } from "@/lib/time";

function StoryRow({
  story,
  loggedIn,
}: {
  story: StoryListItem;
  loggedIn: boolean;
}) {
  const storyPath = `/s/${story.shortId}/${story.slug}`;
  const isText = !story.url;
  const href = story.url ?? storyPath;
  return (
    <li className="story">
      <Voter
        kind="story"
        id={story.id}
        initialVoted={story.voted}
        initialScore={story.upvotes}
        loggedIn={loggedIn}
      />
      <div className="details">
        <span className="link">
          <a className="u-url" href={href}>
            {story.title}
          </a>
        </span>
        {story.tags.map((t) => (
          <Tag key={t.name} tag={t} />
        ))}
        {story.domain && (
          <Link href={`/domains/${story.domain}`} className="domain">
            {story.domain}
          </Link>
        )}
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
          <Link href={storyPath} className="comments_label">
            {story.commentCount === 0
              ? "no comments"
              : `${story.commentCount} comment${story.commentCount === 1 ? "" : "s"}`}
          </Link>
        </div>
      </div>
    </li>
  );
}

export function StoryList({
  stories,
  loggedIn,
  numbered = true,
}: {
  stories: StoryListItem[];
  loggedIn: boolean;
  numbered?: boolean;
}) {
  if (stories.length === 0)
    return <p className="muted">No stories yet.</p>;
  return (
    <ol className={`stories ${numbered ? "numbered" : ""}`}>
      {stories.map((s) => (
        <StoryRow key={s.id} story={s} loggedIn={loggedIn} />
      ))}
    </ol>
  );
}
