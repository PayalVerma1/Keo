import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { verifyAuth } from "@/lib/middleware/auth";
import { prisma } from "@/lib/config/prisma";

/**
 * POST /api/services/[id]/api-key
 *
 * Generates an SDK API key (service-scoped JWT) for the given service.
 * Only the service owner can request a key.
 *
 * Response:
 * {
 *   apiKey: string   // use this as the `apiKey` option in @keo/monitor-sdk
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAuth(req);
  if ("error" in auth) return auth.error;

  const { id: serviceId } = await params;

  // Verify the service belongs to the authenticated user
  const service = await prisma.service.findFirst({
    where: { id: serviceId, ownerID: auth.payload.id },
  });

  if (!service) {
    return NextResponse.json(
      { message: "Service not found or access denied" },
      { status: 404 }
    );
  }

  // Issue a service-scoped SDK JWT (no expiry — user can rotate manually)
  const apiKey = jwt.sign(
    { serviceId: service.id, type: "sdk" },
    process.env.JWT_SECRET!
  );

  return NextResponse.json({ apiKey });
}
