import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import * as logsService from "@/lib/modules/logs/logs.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const { serviceId } = await params;
    const logs = await logsService.getLogs(serviceId);
    return NextResponse.json(logs);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
