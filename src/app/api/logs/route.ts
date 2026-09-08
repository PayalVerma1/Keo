import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, verifyApiKey } from "@/lib/middleware/auth";
import { publishLog } from "@/lib/streams/producers";
import { getRecentLogs } from "@/lib/modules/logs/logs.service";
import { getServices } from "@/lib/modules/services/service.service";

/**
 * POST /api/logs
 *
 * Accepts two authentication modes:
 *  1. SDK API key — @keo/monitor-sdk (service-scoped JWT)
 *  2. NextAuth session — dashboard / internal callers
 */
export async function POST(req: NextRequest) {
  // Try SDK API key first (service-scoped)
  const sdkAuth = verifyApiKey(req);
  if (!("error" in sdkAuth)) {
    try {
      const body = await req.json();
      await publishLog({ ...body, serviceId: sdkAuth.payload.serviceId });
      return NextResponse.json(
        { success: true, message: "log event queued" },
        { status: 202 }
      );
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  }

  // Fall back to NextAuth session
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    await publishLog(body);
    return NextResponse.json(
      { success: true, message: "log event queued" },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/** Returns a bounded, newest-first stream across the signed-in user's services. */
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const requestedLimit = Number(new URL(req.url).searchParams.get("limit") ?? "80");
    const limit = Number.isSafeInteger(requestedLimit) ? requestedLimit : 80;
    const services = await getServices(auth.payload.id);
    const logs = await getRecentLogs(services.map((service) => service.id), limit);
    return NextResponse.json(logs.map(({ service, ...log }) => ({ ...log, serviceName: service.name })));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load logs";
    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
