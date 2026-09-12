import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, verifyAuth } from "@/lib/middleware/auth";
import { prisma } from "@/lib/config/prisma";

export async function resolveAgentService(
  req: NextRequest,
  requestedServiceId?: string
): Promise<{ serviceId: string } | { error: NextResponse }> {
  const sdk = verifyApiKey(req);
  if (!("error" in sdk)) {
    if (requestedServiceId && requestedServiceId !== sdk.payload.serviceId) {
      return { error: NextResponse.json({ message: "API key is not scoped to this service" }, { status: 403 }) };
    }
    return { serviceId: sdk.payload.serviceId };
  }

  const session = await verifyAuth(req);
  if ("error" in session) return { error: session.error };

  if (!requestedServiceId) {
    return { error: NextResponse.json({ message: "serviceId is required" }, { status: 400 }) };
  }

  const service = await prisma.service.findFirst({
    where: { id: requestedServiceId, ownerID: session.payload.id },
    select: { id: true },
  });
  if (!service) {
    return { error: NextResponse.json({ message: "Service not found or access denied" }, { status: 404 }) };
  }
  return { serviceId: service.id };
}
