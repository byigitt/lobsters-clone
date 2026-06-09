import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, stories } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { shortId } from "@/lib/ids";
import { calcHotness } from "@/lib/hotness";
import { isPositiveInt, isNonEmptyString, clampText } from "@/lib/validate";
import { rateLimit } from "@/lib/ratelimit";

const MAX_COMMENT = 10000;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Throttle: at most 10 comments per minute per user.
  const limit = rateLimit(`comment:${user.id}`, 10, 60_000);
  if (!limit.ok)
    return NextResponse.json(
      { error: "rate limited" },
      { status: 429, headers: { "retry-after": String(limit.retryAfter) } },
    );

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const { storyId, parentId, body } = (payload ?? {}) as Record<string, unknown>;

  if (!isPositiveInt(storyId) || !isNonEmptyString(body))
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  if (parentId !== undefined && parentId !== null && !isPositiveInt(parentId))
    return NextResponse.json({ error: "bad request" }, { status: 400 });

  const story = await db
    .select()
    .from(stories)
    .where(eq(stories.id, storyId))
    .get();
  if (!story)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  // Integrity: a reply's parent must exist AND belong to the same story,
  // otherwise a client could graft replies onto unrelated threads.
  let parent: number | null = null;
  if (isPositiveInt(parentId)) {
    const parentRow = await db
      .select({ id: comments.id })
      .from(comments)
      .where(and(eq(comments.id, parentId), eq(comments.storyId, storyId)))
      .get();
    if (!parentRow)
      return NextResponse.json({ error: "bad request" }, { status: 400 });
    parent = parentRow.id;
  }

  await db
    .insert(comments)
    .values({
      shortId: shortId(),
      storyId,
      userId: user.id,
      parentId: parent,
      body: clampText(body, MAX_COMMENT),
    })
    .run();

  const newCount = story.commentCount + 1;
  await db
    .update(stories)
    .set({
      commentCount: newCount,
      hotness: calcHotness(story.upvotes, newCount, story.createdAt),
    })
    .where(eq(stories.id, storyId))
    .run();

  return NextResponse.json({ ok: true });
}
