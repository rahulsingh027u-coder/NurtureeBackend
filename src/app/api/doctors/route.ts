import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const status = url.searchParams.get("status") || "all";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    let whereParts: string[] = [];
    let paramIdx = 1;
    const values: any[] = [];

    if (search) {
      whereParts.push(
        "(u.name ILIKE $" + paramIdx + " OR dp.specialization ILIKE $" + paramIdx + " OR dp.area ILIKE $" + paramIdx + " OR u.phone ILIKE $" + paramIdx + ")"
      );
      values.push("%" + search + "%");
      paramIdx++;
    }

    if (status === "pending") {
      whereParts.push('dp."isActive" = false');
    } else if (status === "approved") {
      whereParts.push('dp."isActive" = true');
    }

    const whereSQL = whereParts.length > 0 ? " AND " + whereParts.join(" AND ") : "";

    const countSQL =
      'SELECT COUNT(*)::int as total FROM "DoctorProfile" dp JOIN "User" u ON dp."userId" = u.id WHERE 1=1' +
      whereSQL;
    const countResult: any = await prisma.$queryRawUnsafe(countSQL, ...values);
    const total = countResult[0].total;

    const dataSQL =
      'SELECT dp.id, dp."userId", dp.specialization, dp.degree, dp."experienceYears", dp."consultationFeeOnline", dp."consultationFeeOffline", dp."registrationNo", dp.area, dp.languages, dp."availableDays", dp.bio, dp."profileComplete", dp."isActive", dp."practiceType", dp."createdAt", u.name, u.email, u.phone, u."createdAt" as "userCreatedAt" FROM "DoctorProfile" dp JOIN "User" u ON dp."userId" = u.id WHERE 1=1' +
      whereSQL +
      ' ORDER BY dp."createdAt" DESC LIMIT ' +
      limit +
      " OFFSET " +
      offset;
    const rows: any = await prisma.$queryRawUnsafe(dataSQL, ...values);

    const doctors = rows.map((r: any) => ({
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
      isOnline: r.practiceType === "online" || r.practiceType === "both",
      isBlocked: false,
      verified: r.isActive,
      avgRating: 0,
      totalConsultations: 0,
      commissionRate: 0,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ doctors, total, page, limit });
  } catch (error: any) {
    console.error("Doctors GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
