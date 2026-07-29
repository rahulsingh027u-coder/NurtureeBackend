import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, email, password, permissions, branches, isActive } = body;

    const subuser = await db.subUser.findUnique({ where: { id } });
    if (!subuser) {
      return NextResponse.json({ error: "SubUser not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (password) data.password = await bcrypt.hash(password, 10);
    if (permissions) data.permissions = JSON.stringify(permissions);
    if (branches) data.activeBranches = JSON.stringify(branches);
    if (typeof isActive === 'boolean') data.isActive = isActive;

    const updated = await db.subUser.update({ where: { id }, data });
    return NextResponse.json({ success: true, id: updated.id });
  } catch (error) {
    console.error("SubUser PATCH error:", error);
    return NextResponse.json({ error: "Failed to update subuser" }, { status: 500 });
  }
}
