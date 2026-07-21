import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const subusers = await db.subUser.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assigner: { select: { name: true } },
      },
    });

    const data = subusers.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      permissions: typeof s.permissions === 'string' ? JSON.parse(s.permissions) : s.permissions,
      activeBranches: typeof s.activeBranches === 'string' ? JSON.parse(s.activeBranches) : s.activeBranches,
      isActive: s.isActive,
      assignerName: s.assigner.name,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Subusers GET error:", error);
    return NextResponse.json({ error: "Failed to fetch subusers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, permissions, activeBranches, assignedBy } = body;

    if (!name || !email || !password || !assignedBy) {
      return NextResponse.json(
        { error: "Name, email, password, and assignedBy are required" },
        { status: 400 }
      );
    }

    const existing = await db.subUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "SubUser with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const subuser = await db.subUser.create({
      data: {
        name,
        email,
        password: hashedPassword,
        permissions: permissions ? JSON.stringify(permissions) : "{}",
        activeBranches: activeBranches ? JSON.stringify(activeBranches) : "[]",
        assignedBy,
      },
    });

    return NextResponse.json(subuser, { status: 201 });
  } catch (error) {
    console.error("Subusers POST error:", error);
    return NextResponse.json({ error: "Failed to create subuser" }, { status: 500 });
  }
}