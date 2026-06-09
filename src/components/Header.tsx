import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

const SITE = process.env.SITE_NAME || "Crab News";

export async function Header() {
  const user = await getCurrentUser();
  return (
    <header id="nav">
      <Link id="logo" href="/" title={SITE} aria-label={SITE} />
      <div className="navholder">
        <nav className="links">
          <span className="sitename">{SITE}</span>
          <Link href="/">Hottest</Link>
          <Link href="/recent">Recent</Link>
          <Link href="/comments">Comments</Link>
          <Link href="/tags">Tags</Link>
          <Link href="/search">Search</Link>
          {user && <Link href="/stories/new">Submit Story</Link>}
        </nav>
        <nav className="corner">
          {user ? (
            <>
              <Link href="/settings/invite">Invite</Link>
              <Link href={`/u/${user.username}`}>{user.username}</Link>
              <span className="muted">({user.karma})</span>
              <Link href="/settings">Settings</Link>
              <Link href="/logout">Logout</Link>
            </>
          ) : (
            <Link href="/login">Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
