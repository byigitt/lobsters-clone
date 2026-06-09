import { getCurrentUser } from "@/lib/auth";
import { getHottest } from "@/lib/queries";
import { StoryList } from "@/components/StoryList";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const stories = await getHottest(user?.id, 25, (page - 1) * 25);

  return (
    <main>
      <StoryList stories={stories} loggedIn={!!user} />
      <div className="pagination">
        {page > 1 && <Link href={`/?page=${page - 1}`}>&laquo; Prev</Link>}{" "}
        {stories.length === 25 && (
          <Link href={`/?page=${page + 1}`}>Next &raquo;</Link>
        )}
      </div>
    </main>
  );
}
