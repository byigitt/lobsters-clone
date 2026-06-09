import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  getCurrentUser,
  verifyPassword,
  createSession,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    redirect("/login?error=1");
  }
  if (user!.bannedAt) redirect("/login?error=banned");
  await createSession(user!.id);
  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const current = await getCurrentUser();
  if (current) redirect("/");
  const { error } = await searchParams;

  return (
    <main>
      <h1 className="page-title">Login</h1>
      {error === "banned" ? (
        <p className="error">This account has been banned.</p>
      ) : error ? (
        <p className="error">Invalid username or password.</p>
      ) : null}
      <form className="box" action={login} style={{ maxWidth: 360 }}>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" autoFocus required />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required />
        <div>
          <button className="btn btn-primary" type="submit">
            Login
          </button>
        </div>
        <p className="hint">
          Crab News is invite-only. No account? You need an invitation from an
          existing member.
        </p>
      </form>
    </main>
  );
}
