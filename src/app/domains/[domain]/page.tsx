import { eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { stories } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getStory } from "@/lib/queries";
import { StoryList } from "@/components/StoryList";

export const dynamic = "force-dynamic";

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const user = await getCurrentUser();
  const rows = await db
    .select({ shortId: stories.shortId })
    .from(stories)
    .where(eq(stories.domain, domain))
    .orderBy(desc(stories.createdAt))
    .all();
  const list = (
    await Promise.all(rows.map((r) => getStory(r.shortId, user?.id)))
  ).filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <main>
      <h1 className="page-title">
        Stories from <span className="domain">{domain}</span>
      </h1>
      <StoryList stories={list} loggedIn={!!user} numbered={false} />
    </main>
  );
}
