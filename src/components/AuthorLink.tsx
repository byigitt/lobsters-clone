import Link from "next/link";
import { isNewUser } from "@/lib/time";

// One place that renders a username link, applying the "new user" green style
// (accounts are new for their first 70 days). Used in story rows, story
// headers, comment bylines and profiles.
export function AuthorLink({
  username,
  createdAt,
}: {
  username: string;
  createdAt: number;
}) {
  return (
    <Link
      href={`/u/${username}`}
      className={`u-author ${isNewUser(createdAt) ? "newuser" : ""}`}
    >
      {username}
    </Link>
  );
}
