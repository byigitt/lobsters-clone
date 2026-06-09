import Link from "next/link";

const SITE = process.env.SITE_NAME || "Crab News";

export default function AboutPage() {
  return (
    <main>
      <h1 className="page-title">About {SITE}</h1>
      <div className="box">
        <p>
          {SITE} is an <strong>invite-only</strong>, computing-focused link
          aggregator and discussion community — a small, self-hosted take on the
          Hacker News / Lobsters format.
        </p>
        <h3>How invitations work</h3>
        <p>
          You can only join with an invitation from an existing member. The full{" "}
          <Link href="/users">invitation tree</Link> is public, so every account
          can be traced back to whoever vouched for them. This provides
          accountability and slows growth to a pace the community can
          acculturate, instead of making membership an elite club.
        </p>
        <ul>
          <li>Any established member can generate an invite link.</li>
          <li>
            Accounts are considered <em>new</em> for their first 70 days and
            appear in <span className="u-author newuser">green</span>.
          </li>
          <li>
            New users can&apos;t send invites or use privileged tags (
            <span className="tag special">show</span>{" "}
            <span className="tag special">ask</span>{" "}
            <span className="tag meta">meta</span> …) yet.
          </li>
        </ul>
        <h3>Tags &amp; ranking</h3>
        <p>
          Every story is tagged from a predefined{" "}
          <Link href="/tags">list of tags</Link>. Ranking comes entirely from
          user votes and comment activity, decayed by age — no moderator
          boosting.
        </p>
        <h3>Demo accounts</h3>
        <p className="muted">
          Login with <code>admin</code>, <code>alice</code>, <code>bob</code>,{" "}
          <code>carol</code>, or <code>dave</code> — password{" "}
          <code>password</code>. Try the invite flow from{" "}
          <Link href="/settings/invite">Invite</Link>.
        </p>
      </div>
    </main>
  );
}
