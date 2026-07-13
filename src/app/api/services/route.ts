import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import * as serviceService from "@/lib/modules/services/service.service";

export async function POST(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const service = await serviceService.createService({
      ...body,
      ownerID: auth.payload.id,
    });
    return NextResponse.json(
      { message: "Service created", service },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const services = await serviceService.getServices(auth.payload.id);
    return NextResponse.json(services);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
