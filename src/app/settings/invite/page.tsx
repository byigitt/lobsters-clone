import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { invitations, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { inviteCode } from "@/lib/ids";
import { isNewUser, ago } from "@/lib/time";

export const dynamic = "force-dynamic";

async function sendInvite(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // new users can't send invites
  if (isNewUser(user!.createdAt) || !user!.canInvite)
    redirect("/settings/invite?error=perm");

  const email = String(formData.get("email") || "").trim();
  const memo = String(formData.get("memo") || "").trim();
  if (!email.includes("@")) redirect("/settings/invite?error=email");

  const code = inviteCode();
  await db
    .insert(invitations)
    .values({ code, email, memo, senderId: user!.id })
    .run();
  redirect("/settings/invite?sent=1");
}

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { error, sent } = await searchParams;
  const newbie = isNewUser(user.createdAt);

  const hdrs = await headers();
  const host = hdrs.get("host") || "localhost:3000";
  const proto = hdrs.get("x-forwarded-proto") || "http";
  const base = `${proto}://${host}`;

  const sentInvites = await db
    .select()
    .from(invitations)
    .where(eq(invitations.senderId, user.id))
    .orderBy(desc(invitations.createdAt))
    .all();

  // resolve used-by usernames
  const usedByIds = sentInvites
    .map((i) => i.usedById)
    .filter((x): x is number => !!x);
  const usedByMap = new Map<number, string>();
  for (const id of usedByIds) {
    const u = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, id))
      .get();
    if (u) usedByMap.set(id, u.username);
  }

  return (
    <main>
      <h1 className="page-title">Invite a new user</h1>

      {newbie ? (
        <div className="flash">
          You&apos;re still a new user (accounts are &quot;new&quot; for their
          first 70 days). New users can&apos;t send invitations yet — this helps
          us acculturate growth and combat spam.
        </div>
      ) : (
        <>
          {sent && (
            <div className="flash">Invitation created. Share the link below.</div>
          )}
          {error === "email" && (
            <p className="error">Please enter a valid email address.</p>
          )}
          {error === "perm" && (
            <p className="error">You don&apos;t have permission to invite.</p>
          )}
          <form className="box" action={sendInvite} style={{ maxWidth: 460 }}>
            <p className="hint" style={{ marginTop: 0 }}>
              You are responsible for who you invite. Invite people you believe
              will contribute positively. The whole invitation tree is public.
            </p>
            <label htmlFor="email">Their email</label>
            <input id="email" name="email" type="email" required />
            <label htmlFor="memo">A note (optional)</label>
            <input id="memo" name="memo" type="text" placeholder="How you know them, etc." />
            <div>
              <button className="btn btn-primary" type="submit">
                Generate invitation
              </button>
            </div>
          </form>
        </>
      )}

      <h2 className="page-title" style={{ marginTop: "1.5rem" }}>
        Invitations you&apos;ve sent
      </h2>
      {sentInvites.length === 0 ? (
        <p className="muted">You haven&apos;t sent any invitations yet.</p>
      ) : (
        <table className="data">
          <thead>
            <tr>
              <th>Email</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            {sentInvites.map((i) => (
              <tr key={i.id}>
                <td>{i.email}</td>
                <td>
                  {i.usedById ? (
                    <span className="muted">
                      accepted by {usedByMap.get(i.usedById) || "user"}
                    </span>
                  ) : (
                    <span style={{ color: "var(--color-accent)" }}>pending</span>
                  )}
                </td>
                <td className="muted">{ago(i.createdAt)}</td>
                <td>
                  {i.usedById ? (
                    "—"
                  ) : (
                    <a href={`${base}/signup/${i.code}`}>{`/signup/${i.code.slice(0, 8)}…`}</a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
