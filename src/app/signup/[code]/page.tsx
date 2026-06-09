import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, invitations } from "@/db/schema";
import { hashPassword, createSession, getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_-]{1,24}$/;

async function register(formData: FormData) {
  "use server";
  const code = String(formData.get("code") || "");
  const username = String(formData.get("username") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const about = String(formData.get("about") || "").trim();

  const invite = await db
    .select()
    .from(invitations)
    .where(eq(invitations.code, code))
    .get();
  if (!invite || invite.usedById) redirect(`/signup/${code}?error=invite`);

  if (!USERNAME_RE.test(username)) redirect(`/signup/${code}?error=username`);
  if (password.length < 6) redirect(`/signup/${code}?error=password`);
  if (!email.includes("@")) redirect(`/signup/${code}?error=email`);

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();
  if (existing) redirect(`/signup/${code}?error=taken`);

  const passwordHash = await hashPassword(password);
  const [newUser] = await db
    .insert(users)
    .values({
      username,
      email,
      passwordHash,
      about,
      invitedById: invite!.senderId,
    })
    .returning()
    .all();

  await db
    .update(invitations)
    .set({ usedById: newUser.id })
    .where(eq(invitations.id, invite!.id))
    .run();

  await createSession(newUser.id);
  redirect("/");
}

export default async function SignupPage({
  params,
  searchParams,
}: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [current, { code }, { error }] = await Promise.all([
    getCurrentUser(),
    params,
    searchParams,
  ]);
  if (current) redirect("/");

  const invite = await db
    .select({
      id: invitations.id,
      email: invitations.email,
      memo: invitations.memo,
      usedById: invitations.usedById,
      senderName: users.username,
    })
    .from(invitations)
    .innerJoin(users, eq(invitations.senderId, users.id))
    .where(eq(invitations.code, code))
    .get();

  if (!invite || invite.usedById) {
    return (
      <main>
        <h1 className="page-title">Invitation</h1>
        <div className="box">
          <p className="error">
            This invitation link is invalid or has already been used.
          </p>
          <p className="hint">
            Crab News is invite-only. Ask a member you know for a fresh
            invitation.
          </p>
        </div>
      </main>
    );
  }

  const errMsg: Record<string, string> = {
    username:
      "Username must start with a letter and be 2–25 chars (letters, numbers, _ or -).",
    password: "Password must be at least 6 characters.",
    email: "Please enter a valid email address.",
    taken: "That username is already taken.",
    invite: "This invitation is no longer valid.",
  };

  return (
    <main>
      <h1 className="page-title">Join Crab News</h1>
      <div className="flash">
        You were invited by <strong>{invite.senderName}</strong>
        {invite.memo ? ` — “${invite.memo}”` : ""}. Welcome aboard.
      </div>
      {error && <p className="error">{errMsg[error] || "Something went wrong."}</p>}
      <form className="box" action={register} style={{ maxWidth: 460 }}>
        <input type="hidden" name="code" value={code} />
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" required autoFocus />
        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={invite.email}
          required
        />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
        <label htmlFor="about">About you (optional)</label>
        <textarea id="about" name="about" style={{ minHeight: "4rem" }} />
        <div>
          <button className="btn btn-primary" type="submit">
            Create account
          </button>
        </div>
      </form>
    </main>
  );
}
