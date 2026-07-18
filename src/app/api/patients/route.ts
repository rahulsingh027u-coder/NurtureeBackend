import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "20")));

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { uhid: { contains: search } },
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [patients, total] = await Promise.all([
      db.patient.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { bookings: true } },
          bookings: {
            select: { date: true },
            orderBy: { date: "desc" },
            take: 1,
          },
        },
      }),
      db.patient.count({ where }),
    ]);

    const data = patients.map((p) => ({
      id: p.id,
      uhid: p.uhid,
      name: p.name,
      email: p.email,
      phone: p.phone,
      age: p.age,
      gender: p.gender,
      bloodGroup: p.bloodGroup,
      allergies: p.allergies,
      city: p.city,
      bookingCount: p._count.bookings,
      lastVisit: p.bookings[0]?.date ?? null,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Patients GET error:", error);
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}