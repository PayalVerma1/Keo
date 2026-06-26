import { NextRequest, NextResponse } from "next/server";
import { verifyAuth, verifyApiKey } from "@/lib/middleware/auth";
import { publishDeployment } from "@/lib/streams/producers";

/**
 * POST /api/deployments
 *
 * Accepts two authentication modes:
 *  1. User JWT  — dashboard / internal callers
 *  2. SDK API key — @keo/monitor-sdk (service-scoped)
 */
export async function POST(req: NextRequest) {
  // Try SDK API key first (service-scoped)
  const sdkAuth = verifyApiKey(req);
  if (!("error" in sdkAuth)) {
    try {
      const body = await req.json();
      await publishDeployment({ ...body, serviceId: sdkAuth.payload.serviceId });
      return NextResponse.json(
        { success: true, message: "deployment event queued" },
        { status: 202 }
      );
    } catch (error: any) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
  }

  // Fall back to user JWT
  const auth = verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    await publishDeployment(body);
    return NextResponse.json(
      { success: true, message: "deployment event queued" },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
