import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import * as deploymentService from "@/lib/modules/deployments/deployment.service";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const { serviceId } = await params;
    const deployments = await deploymentService.getDeployments(serviceId);
    return NextResponse.json(deployments);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
