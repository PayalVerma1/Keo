import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export type AuthPayload = { id: string };

/**
 * Verifies the Authorization header and returns the decoded payload.
 * Returns a 401 NextResponse if auth fails (caller should return it).
 */
export function verifyAuth(
  req: NextRequest
): { payload: AuthPayload } | { error: NextResponse } {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return {
      error: NextResponse.json({ message: "No token provided" }, { status: 401 }),
    };
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return {
      error: NextResponse.json({ message: "Invalid token format" }, { status: 401 }),
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    return { payload: decoded };
  } catch {
    return {
      error: NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 401 }
      ),
    };
  }
}
