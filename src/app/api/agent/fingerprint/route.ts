import { NextRequest, NextResponse } from "next/server";
import { resolveAgentService } from "@/lib/middleware/agent-auth";
import { buildFingerprint } from "@/lib/modules/impact/fingerprint";

export async function GET(req: NextRequest) {
  const serviceId = req.nextUrl.searchParams.get("serviceId") ?? undefined;
  const resolved = await resolveAgentService(req, serviceId);
  if ("error" in resolved) return resolved.error;

  try {
    const fingerprint = await buildFingerprint(resolved.serviceId);
    return NextResponse.json(fingerprint);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to build fingerprint" },
      { status: 500 }
    );
  }
}
