import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isPositiveInt } from "@/lib/validate";
import { rateLimit } from "@/lib/ratelimit";
import { toggleStoryVote, toggleCommentVote } from "@/lib/votes";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Throttle: at most 60 votes per minute per user.
  const limit = rateLimit(`vote:${user.id}`, 60, 60_000);
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
  const { kind, id } = (payload ?? {}) as Record<string, unknown>;
  if ((kind !== "story" && kind !== "comment") || !isPositiveInt(id))
    return NextResponse.json({ error: "bad request" }, { status: 400 });

  const result =
    kind === "story"
      ? await toggleStoryVote(user.id, id)
      : await toggleCommentVote(user.id, id);

  if (!result) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(result);
}
