import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import { prisma } from "@/lib/config/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ serviceId: string }> }
) {
  const auth = verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const { serviceId } = await params;
    const insights = await prisma.insight.findMany({
      where: { serviceId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json(insights);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
