import { NextResponse } from "next/server";

/** Liveness endpoint used by the verification sandbox and container platform. */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
