import { getCurrentUser } from "@/lib/auth";
import { getRecent } from "@/lib/queries";
import { StoryList } from "@/components/StoryList";
import { pageMeta } from "@/lib/meta";

export const metadata = pageMeta(
  "Recent",
  "The most recently submitted stories.",
);
export const dynamic = "force-dynamic";

export default async function RecentPage() {
  const user = await getCurrentUser();
  const stories = await getRecent(user?.id, 25);
  return (
    <main>
      <h1 className="page-title">Recent Stories</h1>
      <StoryList stories={stories} loggedIn={!!user} numbered={false} />
    </main>
  );
}
