import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { comments, stories } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { shortId } from "@/lib/ids";
import { calcHotness } from "@/lib/hotness";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { storyId, parentId, body } = await req.json();
  if (typeof storyId !== "number" || typeof body !== "string" || !body.trim())
    return NextResponse.json({ error: "bad request" }, { status: 400 });

  const story = await db
    .select()
    .from(stories)
    .where(eq(stories.id, storyId))
    .get();
  if (!story)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  await db
    .insert(comments)
    .values({
      shortId: shortId(),
      storyId,
      userId: user.id,
      parentId: typeof parentId === "number" ? parentId : null,
      body: body.trim().slice(0, 10000),
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
