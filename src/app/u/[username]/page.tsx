import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getStoriesByUser } from "@/lib/queries";
import { StoryList } from "@/components/StoryList";
import { ago, isNewUser } from "@/lib/time";

import { pageMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return pageMeta(username, `Profile and stories submitted by ${username}.`);
}

export default async function UserPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const [{ username }, viewer] = await Promise.all([params, getCurrentUser()]);

  const profile = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();
  if (!profile) notFound();

  const [invitedBy, invitees, stories] = await Promise.all([
    profile.invitedById
      ? db
          .select({ username: users.username })
          .from(users)
          .where(eq(users.id, profile.invitedById))
          .get()
      : Promise.resolve(null),
    db
      .select({ username: users.username, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.invitedById, profile.id))
      .all(),
    getStoriesByUser(username, viewer?.id),
  ]);
  const newbie = isNewUser(profile.createdAt);

  return (
    <main>
      <div className="box">
        <h1 className="page-title" style={{ marginTop: 0 }}>
          <span className={`u-author ${newbie ? "newuser" : ""}`}>
            {profile.username}
          </span>
          {profile.isAdmin && <span className="tag special" style={{ marginLeft: 8 }}>admin</span>}
          {profile.isModerator && !profile.isAdmin && (
            <span className="tag meta" style={{ marginLeft: 8 }}>mod</span>
          )}
        </h1>
        <table className="data">
          <tbody>
            <tr>
              <th>Joined</th>
              <td>
                {ago(profile.createdAt)} {newbie && <span className="muted">(new user)</span>}
              </td>
            </tr>
            <tr>
              <th>Karma</th>
              <td>{profile.karma}</td>
            </tr>
            <tr>
              <th>Invited by</th>
              <td>
                {invitedBy ? (
                  <Link href={`/u/${invitedBy.username}`}>{invitedBy.username}</Link>
                ) : (
                  <span className="muted">— (founding user)</span>
                )}
              </td>
            </tr>
            <tr>
              <th>Invited</th>
              <td>
                {invitees.length === 0 ? (
                  <span className="muted">no one yet</span>
                ) : (
                  invitees.map((u, i) => (
                    <span key={u.username}>
                      {i > 0 && ", "}
                      <Link href={`/u/${u.username}`}>{u.username}</Link>
                    </span>
                  ))
                )}
              </td>
            </tr>
          </tbody>
        </table>
        {profile.about && (
          <p style={{ marginBottom: 0 }}>{profile.about}</p>
        )}
      </div>

      <h2 className="page-title">Stories submitted by {profile.username}</h2>
      <StoryList stories={stories} loggedIn={!!viewer} numbered={false} />
    </main>
  );
}
