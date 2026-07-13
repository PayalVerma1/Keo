import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import jwt from "jsonwebtoken";

export type AuthPayload = { id: string };

/** Payload embedded inside an SDK API key */
export type ApiKeyPayload = { serviceId: string; type: "sdk" };

/**
 * Verifies the NextAuth session and returns the authenticated user's id.
 * Returns a 401 NextResponse if the session is missing (caller should return it).
 */
export async function verifyAuth(
  _req: NextRequest
): Promise<{ payload: AuthPayload } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }

  const userId = (session.user as any).id as string | undefined;
  if (!userId) {
    return {
      error: NextResponse.json({ message: "Session missing user id" }, { status: 401 }),
    };
  }

  return { payload: { id: userId } };
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
