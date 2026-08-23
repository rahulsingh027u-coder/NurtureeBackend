import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("nurturee_admin_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both passwords required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const admin = await db.admin.findUnique({ where: { email: payload.email as string } });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    const valid = bcrypt.compareSync(currentPassword, admin.password);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

    const hashed = bcrypt.hashSync(newPassword, 10);
    await db.admin.update({ where: { id: admin.id }, data: { password: hashed } });

    return NextResponse.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
