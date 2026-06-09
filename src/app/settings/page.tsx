import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function save(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const about = String(formData.get("about") || "").trim();
  const email = String(formData.get("email") || "").trim();
  await db
    .update(users)
    .set({ about, email: email || user!.email })
    .where(eq(users.id, user!.id))
    .run();
  redirect("/settings?saved=1");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { saved } = await searchParams;

  return (
    <main>
      <h1 className="page-title">Settings</h1>
      {saved && <div className="flash">Saved.</div>}
      <form className="box" action={save} style={{ maxWidth: 460 }}>
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={user.username}
          readOnly
          aria-describedby="username-hint"
        />
        <span id="username-hint" className="hint">
          Usernames can&apos;t be changed.
        </span>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" defaultValue={user.email} />
        <label htmlFor="about">About</label>
        <textarea id="about" name="about" defaultValue={user.about} />
        <div>
          <button className="btn btn-primary" type="submit">
            Save
          </button>
        </div>
      </form>
      <p className="hint">
        Want to grow the community?{" "}
        <Link href="/settings/invite">Invite someone &raquo;</Link>
      </p>
    </main>
  );
}
