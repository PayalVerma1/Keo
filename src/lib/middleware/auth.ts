import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export type AuthPayload = { id: string };

/** Payload embedded inside an SDK API key */
export type ApiKeyPayload = { serviceId: string; type: "sdk" };

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

/**
 * Verifies an SDK API key (service-scoped JWT).
 * Returns the decoded ApiKeyPayload or a 401 NextResponse.
 *
 * SDK API keys are generated via POST /api/services/[id]/api-key
 * and are scoped to a single serviceId.
 */
export function verifyApiKey(
  req: NextRequest
): { payload: ApiKeyPayload } | { error: NextResponse } {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return {
      error: NextResponse.json({ message: "No API key provided" }, { status: 401 }),
    };
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return {
      error: NextResponse.json({ message: "Invalid API key format" }, { status: 401 }),
    };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as ApiKeyPayload;
    if (decoded.type !== "sdk") {
      return {
        error: NextResponse.json({ message: "Not an SDK API key" }, { status: 401 }),
      };
    }
    return { payload: decoded };
  } catch {
    return {
      error: NextResponse.json(
        { message: "Invalid or expired API key" },
        { status: 401 }
      ),
    };
  }
}
