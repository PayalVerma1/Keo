import { NextRequest, NextResponse } from "next/server";
import * as authService from "@/lib/modules/auth/auth.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const user = await authService.register(body);
    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
