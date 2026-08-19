import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { createToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const admin = await db.admin.findUnique({ where: { email } });
    if (admin) {
      const valid = bcrypt.compareSync(password, admin.password);
      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      if (!admin.isActive) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
      const token = await createToken({ id: admin.id, email: admin.email, role: admin.role });
      const res = NextResponse.json({
        id: admin.id, name: admin.name, email: admin.email, role: admin.role,
        permissions: JSON.parse(admin.permissions || "[]"),
        activeBranches: JSON.parse(admin.activeBranches || "[]"),
      });
      res.cookies.set("nurturee_admin_token", token, {
        httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/",
      });
      return res;
    }

    const subuser = await db.subUser.findUnique({ where: { email } });
    if (subuser) {
      const valid = bcrypt.compareSync(password, subuser.password);
      if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      if (!subuser.isActive) return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
      const token = await createToken({ id: subuser.id, email: subuser.email, role: "sub_user" });
      const res = NextResponse.json({
        id: subuser.id, name: subuser.name, email: subuser.email, role: "sub_user" as const,
        permissions: JSON.parse(subuser.permissions || "[]"),
        activeBranches: JSON.parse(subuser.activeBranches || "[]"),
      });
      res.cookies.set("nurturee_admin_token", token, {
        httpOnly: true, secure: true, sameSite: "lax", maxAge: 86400, path: "/",
      });
      return res;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
