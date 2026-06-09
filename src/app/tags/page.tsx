import Link from "next/link";
import { getAllTags } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await getAllTags();
  return (
    <main>
      <h1 className="page-title">Tags</h1>
      <p className="hint" style={{ marginTop: 0 }}>
        Stories must be tagged from this predefined list. Tags marked
        privileged can&apos;t be used by new users.
      </p>
      <ul className="tag-list">
        {tags.map((t) => (
          <li key={t.id}>
            <Link
              href={`/t/${t.name}`}
              className={`tag ${t.kind === "default" ? "" : t.kind}`}
            >
              {t.name}
            </Link>{" "}
            <span className="muted">{t.description}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
