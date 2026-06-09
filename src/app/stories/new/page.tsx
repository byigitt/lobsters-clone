import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { stories, storyTags, tags } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { shortId, slugify } from "@/lib/ids";
import { calcHotness } from "@/lib/hotness";
import { isNewUser } from "@/lib/time";
import { getAllTags } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function submit(formData: FormData) {
  "use server";
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") || "").trim();
  const url = String(formData.get("url") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const selectedTags = formData.getAll("tags").map(String);

  if (!title) redirect("/stories/new?error=title");
  if (!url && !description) redirect("/stories/new?error=content");
  if (selectedTags.length === 0) redirect("/stories/new?error=tags");

  let domain: string | null = null;
  if (url) {
    try {
      domain = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      redirect("/stories/new?error=url");
    }
  }

  // enforce privileged tags for non-new users
  const tagRows = await db
    .select()
    .from(tags)
    .where(inArray(tags.name, selectedTags))
    .all();
  const newbie = isNewUser(user!.createdAt);
  if (newbie && tagRows.some((t) => t.privileged))
    redirect("/stories/new?error=privileged");

  const sid = shortId();
  const tagMod = tagRows.reduce((a, t) => a + t.hotnessMod, 0);
  const createdAt = Math.floor(Date.now() / 1000);
  const [story] = await db
    .insert(stories)
    .values({
      shortId: sid,
      title,
      url: url || null,
      domain,
      description,
      slug: slugify(title),
      userId: user!.id,
      createdAt,
      upvotes: 1,
      hotness: calcHotness(1, 0, createdAt, tagMod),
    })
    .returning()
    .all();

  for (const t of tagRows)
    await db.insert(storyTags).values({ storyId: story.id, tagId: t.id }).run();

  redirect(`/s/${sid}/${story.slug}`);
}

export default async function NewStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { error } = await searchParams;
  const allTags = await getAllTags();
  const newbie = isNewUser(user.createdAt);

  const errMsg: Record<string, string> = {
    title: "A title is required.",
    content: "Provide a URL or some text.",
    tags: "Choose at least one tag.",
    url: "That URL doesn't look valid.",
    privileged:
      "New users can't use privileged tags (show, ask, meta, etc.) yet.",
  };

  return (
    <main>
      <h1 className="page-title">Submit a Story</h1>
      {error && <p className="error">{errMsg[error] || "Something went wrong."}</p>}
      <form className="box" action={submit}>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" type="text" required autoFocus />

        <label htmlFor="url">URL</label>
        <input id="url" name="url" type="url" placeholder="https://…" />
        <p className="hint">Leave blank to post a text/ask story instead.</p>

        <label htmlFor="description">Text (optional, markdown)</label>
        <textarea id="description" name="description" />

        <label htmlFor="tags">Tags</label>
        <select id="tags" name="tags" multiple size={10}>
          {allTags.map((t) => (
            <option
              key={t.id}
              value={t.name}
              disabled={newbie && t.privileged}
            >
              {t.name}
              {t.privileged ? " (privileged)" : ""} — {t.description}
            </option>
          ))}
        </select>
        <p className="hint">
          Hold ⌘/Ctrl to select multiple tags.
          {newbie && " As a new user, privileged tags are disabled."}
        </p>

        <div>
          <button className="btn btn-primary" type="submit">
            Submit
          </button>
        </div>
      </form>
    </main>
  );
}
