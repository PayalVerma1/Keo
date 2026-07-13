import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import * as metricsService from "@/lib/modules/metrics/metrics.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const { id } = await params;
    const metrics = await metricsService.getMetrics(id);
    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
