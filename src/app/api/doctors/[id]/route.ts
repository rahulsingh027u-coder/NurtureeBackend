import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows: any = await prisma.$queryRawUnsafe(
      'SELECT dp.*, u.name, u.email, u.phone FROM "DoctorProfile" dp JOIN "User" u ON dp."userId" = u.id WHERE dp.id = $1',
      id
    );
    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }
    const r = rows[0];
    const doctor = {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      specialty: r.specialization,
      qualifications: r.degree,
      experience: r.experienceYears,
      feeOnline: r.consultationFeeOnline,
      feeAtHome: r.consultationFeeOffline,
      area: r.area,
      languages: r.languages,
      registrationNo: r.registrationNo,
      practiceType: r.practiceType,
      availableDays: r.availableDays,
      bio: r.bio,
      profileComplete: r.profileComplete,
      isActive: r.isActive,
      verified: r.isActive,
      isOnline: r.practiceType === "online" || r.practiceType === "both",
      isBlocked: false,
      avgRating: 0,
      totalConsultations: 0,
      createdAt: r.createdAt,
    };
    return NextResponse.json({ doctor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const allowed = ["isActive", "isBlocked"];
    const updates: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        updates.push('"' + key + '" = $' + idx);
        values.push(body[key]);
        idx++;
      }
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    values.push(id);
    const sql = 'UPDATE "DoctorProfile" SET ' + updates.join(", ") + " WHERE id = $" + idx;
    await prisma.$queryRawUnsafe(sql, ...values);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
