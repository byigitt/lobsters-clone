import { getCurrentUser } from "@/lib/auth";
import { StoryList } from "@/components/StoryList";
import { searchStories } from "@/lib/queries";
import { pageMeta } from "@/lib/meta";
import { pluralize } from "@/lib/format";

export const metadata = pageMeta("Search", "Search stories and discussions.");
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ q }, user] = await Promise.all([searchParams, getCurrentUser()]);
  const query = (q || "").trim();
  const found = query ? await searchStories(query, user?.id) : [];

  return (
    <main>
      <h1 className="page-title">Search</h1>
      <form className="box" method="get" style={{ maxWidth: 460 }}>
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Search stories…"
          aria-label="Search stories"
        />
        <button className="btn btn-primary" type="submit">
          Search
        </button>
      </form>
      {query && (
        <>
          <p className="muted">
            {pluralize(found.length, "result")} for &quot;{query}&quot;
          </p>
          <StoryList stories={found} loggedIn={!!user} numbered={false} />
        </>
      )}
    </main>
  );
}
