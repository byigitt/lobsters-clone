import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { isNewUser } from "@/lib/time";

export const dynamic = "force-dynamic";

type Node = {
  id: number;
  username: string;
  createdAt: number;
  isAdmin: boolean;
  children: Node[];
};

export default async function UsersPage() {
  const all = await db
    .select({
      id: users.id,
      username: users.username,
      createdAt: users.createdAt,
      invitedById: users.invitedById,
      isAdmin: users.isAdmin,
    })
    .from(users)
    .all();

  const map = new Map<number, Node>();
  for (const u of all)
    map.set(u.id, {
      id: u.id,
      username: u.username,
      createdAt: u.createdAt,
      isAdmin: u.isAdmin,
      children: [],
    });
  const roots: Node[] = [];
  for (const u of all) {
    const node = map.get(u.id)!;
    if (u.invitedById && map.has(u.invitedById))
      map.get(u.invitedById)!.children.push(node);
    else roots.push(node);
  }

  return (
    <main>
      <h1 className="page-title">User Invitation Tree</h1>
      <p className="hint" style={{ marginTop: 0 }}>
        The full tree is public. Each user shows who they invited. New users
        appear in <span className="u-author newuser">green</span>.
      </p>
      <ul className="user-tree">
        {roots.map((r) => (
          <TreeNode key={r.id} node={r} />
        ))}
      </ul>
      <p className="muted">{all.length} users total.</p>
    </main>
  );
}

function TreeNode({ node }: { node: Node }) {
  return (
    <li>
      <Link
        href={`/u/${node.username}`}
        className={`u-author ${isNewUser(node.createdAt) ? "newuser" : ""}`}
      >
        {node.username}
      </Link>
      {node.isAdmin && <span className="muted"> (admin)</span>}
      {node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <TreeNode key={c.id} node={c} />
          ))}
        </ul>
      )}
    </li>
  );
}
