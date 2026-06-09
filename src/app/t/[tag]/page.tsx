import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { getStoriesByTag } from "@/lib/queries";
import { StoryList } from "@/components/StoryList";

import { pageMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  return pageMeta(`Stories tagged ${tag}`, `Stories tagged ${tag}.`);
}

export default async function TagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const tagRow = await db.select().from(tags).where(eq(tags.name, tag)).get();
  if (!tagRow) notFound();

  const user = await getCurrentUser();
  const stories = await getStoriesByTag(tag, user?.id);

  return (
    <main>
      <h1 className="page-title">
        Stories tagged <span className={`tag ${tagRow.kind === "default" ? "" : tagRow.kind}`}>{tag}</span>
      </h1>
      <p className="hint" style={{ marginTop: 0 }}>{tagRow.description}</p>
      <StoryList stories={stories} loggedIn={!!user} numbered={false} />
    </main>
  );
}
