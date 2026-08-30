import { NextRequest, NextResponse } from "next/server";

/** Authenticates CI callers without exposing dashboard sessions to a runner. */
export function verifyVerificationToken(req: NextRequest) {
  const expectedToken = process.env.KEO_VERIFICATION_TOKEN;
  const receivedToken = req.headers.get("x-keo-verification-token");

  if (!expectedToken || !receivedToken || receivedToken !== expectedToken) {
    return NextResponse.json({ message: "Unauthorized verification request" }, { status: 401 });
  }

  return null;
}
