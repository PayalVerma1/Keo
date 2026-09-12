import { NextRequest, NextResponse } from "next/server";
import { resolveAgentService } from "@/lib/middleware/agent-auth";
import { wouldThisRegress } from "@/lib/modules/impact/evaluate";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      serviceId?: string;
      baselineServiceId?: string;
      observed?: {
        cpu?: number;
        memory?: number;
        latency?: number;
        errors?: number;
        routes?: unknown;
      };
      jobId?: string;
      changedFiles?: string[];
      diff?: string;
      thresholds?: Record<string, unknown>;
      explain?: boolean;
    };

    const resolved = await resolveAgentService(req, body.serviceId);
    if ("error" in resolved) return resolved.error;

    const report = await wouldThisRegress({
      serviceId: resolved.serviceId,
      baselineServiceId: body.baselineServiceId,
      observed: body.observed,
      jobId: body.jobId,
      changedFiles: body.changedFiles,
      diff: body.diff,
      thresholds: body.thresholds,
      explain: body.explain,
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to evaluate regression" },
      { status: 500 }
    );
  }
}
