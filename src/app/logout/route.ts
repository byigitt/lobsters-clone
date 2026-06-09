import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

// POST-only: logout mutates session state, so it must not be a GET handler
// (GET prefetching would let any page silently log users out — CSRF).
export async function POST(req: Request) {
  await destroySession();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
