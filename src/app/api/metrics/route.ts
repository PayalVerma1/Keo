import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import { publishMetric } from "@/lib/streams/producers";

export async function POST(req: NextRequest) {
  const auth = verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    await publishMetric(body);
    return NextResponse.json(
      { success: true, message: "metrics event queued" },
      { status: 202 }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
