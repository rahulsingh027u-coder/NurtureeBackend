import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");
    const verified = searchParams.get("verified");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "20")));

    const specialization = searchParams.get("specialization");
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { specialty: { contains: search } },
      ];
    }

    if (status === "online") where.isOnline = true;
    else if (status === "offline") where.isOnline = false;
    else if (status === "blocked") where.isBlocked = true;

    if (verified === "true") where.verified = true;
    else if (verified === "false") where.verified = false;

    if (specialization) where.specialty = specialization;

    const [doctors, total] = await Promise.all([
      db.doctor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { bookings: true } },
          commissions: {
            where: { paymentStatus: "pending" },
            select: { commissionAmount: true },
          },
        },
      }),
      db.doctor.count({ where }),
    ]);

    // Get total earnings per doctor from completed bookings
    const doctorIds = doctors.map((d) => d.id);
    const earningsMap: Record<string, number> = {};
    if (doctorIds.length > 0) {
      const earningsRows = await db.booking.groupBy({
        by: ["doctorId"],
        where: { doctorId: { in: doctorIds }, status: "completed" },
        _sum: { doctorEarnings: true },
      });
      for (const row of earningsRows) {
        earningsMap[row.doctorId!] = row._sum.doctorEarnings || 0;
      }
    }

    const data = doctors.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone,
      specialty: d.specialty,
      qualifications: d.qualifications,
      experience: d.experience,
      languages: d.languages,
      area: d.area,
      feeOnline: d.feeOnline,
      feeAtHome: d.feeAtHome,
      commissionRate: d.commissionRate,
      isOnline: d.isOnline,
      isPortalUser: d.isPortalUser,
      isBlocked: d.isBlocked,
      verified: d.verified,
      avgRating: d.avgRating,
      totalConsultations: d.totalConsultations,
      bookingCount: d._count.bookings,
      totalEarnings: earningsMap[d.id] || 0,
      commissionDue: d.commissions.reduce(
        (sum: number, c: { commissionAmount: number }) => sum + c.commissionAmount,
        0
      ),
      createdAt: d.createdAt,
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Doctors GET error:", error);
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      email,
      phone,
      password,
      specialty,
      qualifications,
      experience,
      languages,
      area,
      feeOnline,
      feeAtHome,
      commissionRate,
      bio,
    } = body;

    if (!name || !email || !phone || !password || !specialty) {
      return NextResponse.json(
        { error: "Name, email, phone, password, and specialty are required" },
        { status: 400 }
      );
    }

    const existing = await db.doctor.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Doctor with this email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const doctor = await db.doctor.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        specialty,
        qualifications: qualifications ?? "",
        experience: experience ?? 0,
        languages: languages ? JSON.stringify(languages) : "[]",
        area: area ?? "",
        feeOnline: feeOnline ?? 0,
        feeAtHome: feeAtHome ?? 0,
        commissionRate: commissionRate ?? 15,
        bio: bio ?? null,
      },
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (error) {
    console.error("Doctors POST error:", error);
    return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 });
  }
}