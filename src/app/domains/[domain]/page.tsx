import { getCurrentUser } from "@/lib/auth";
import { getStoriesByDomain } from "@/lib/queries";
import { StoryList } from "@/components/StoryList";

import { pageMeta } from "@/lib/meta";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  return pageMeta(`Stories from ${domain}`, `Stories linking to ${domain}.`);
}

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const [{ domain }, user] = await Promise.all([params, getCurrentUser()]);
  const list = await getStoriesByDomain(domain, user?.id);

  return (
    <main>
      <h1 className="page-title">
        Stories from <span className="domain">{domain}</span>
      </h1>
      <StoryList stories={list} loggedIn={!!user} numbered={false} />
    </main>
  );
}
