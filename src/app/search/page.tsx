import { like, or, desc } from "drizzle-orm";
import { db } from "@/db";
import { stories, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { StoryList } from "@/components/StoryList";
import { getStory } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const user = await getCurrentUser();
  const query = (q || "").trim();

  let results = [] as Awaited<ReturnType<typeof getStory>>[];
  if (query) {
    const rows = await db
      .select({ shortId: stories.shortId })
      .from(stories)
      .where(
        or(
          like(stories.title, `%${query}%`),
          like(stories.description, `%${query}%`),
        ),
      )
      .orderBy(desc(stories.hotness))
      .limit(25)
      .all();
    results = await Promise.all(
      rows.map((r) => getStory(r.shortId, user?.id)),
    );
  }

  const found = results.filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <main>
      <h1 className="page-title">Search</h1>
      <form className="box" method="get" style={{ maxWidth: 460 }}>
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search stories…"
          autoFocus
        />
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>
      {query && (
        <>
          <p className="muted">
            {found.length} result{found.length === 1 ? "" : "s"} for &quot;{query}&quot;
          </p>
          <StoryList stories={found} loggedIn={!!user} numbered={false} />
        </>
      )}
    </main>
  );
}
