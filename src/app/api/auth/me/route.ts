import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import { prisma } from "@/lib/config/prisma";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.payload.id },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { name } = body;
    if (!name?.trim()) {
      return NextResponse.json({ message: "Name is required" }, { status: 400 });
    }
    const updated = await prisma.user.update({
      where: { id: auth.payload.id },
      data: { name: name.trim() },
      select: { id: true, name: true, email: true, createdAt: true },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
