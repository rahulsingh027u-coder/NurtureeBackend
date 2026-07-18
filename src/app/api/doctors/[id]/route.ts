import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doctor = await db.doctor.findUnique({
      where: { id },
      include: {
        _count: { select: { bookings: true } },
        commissions: {
          where: { paymentStatus: "pending" },
          select: { commissionAmount: true },
        },
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    // Calculate total earnings from completed bookings
    const earningsAgg = await db.booking.aggregate({
      where: { doctorId: id, status: "completed" },
      _sum: { doctorEarnings: true, commissionAmount: true, totalAmount: true },
    });

    return NextResponse.json({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phone: doctor.phone,
      specialty: doctor.specialty,
      qualifications: doctor.qualifications,
      experience: doctor.experience,
      languages: doctor.languages,
      area: doctor.area,
      bio: doctor.bio,
      feeOnline: doctor.feeOnline,
      feeAtHome: doctor.feeAtHome,
      commissionRate: doctor.commissionRate,
      isOnline: doctor.isOnline,
      isPortalUser: doctor.isPortalUser,
      isBlocked: doctor.isBlocked,
      blockReason: doctor.blockReason,
      verified: doctor.verified,
      avgRating: doctor.avgRating,
      totalConsultations: doctor.totalConsultations,
      bookingCount: doctor._count.bookings,
      totalEarnings: earningsAgg._sum.doctorEarnings || 0,
      totalRevenue: earningsAgg._sum.totalAmount || 0,
      totalCommissionPaid: (earningsAgg._sum.commissionAmount || 0),
      commissionDue: doctor.commissions.reduce(
        (sum: number, c: { commissionAmount: number }) => sum + c.commissionAmount,
        0
      ),
      createdAt: doctor.createdAt,
    });
  } catch (error) {
    console.error("Doctor GET by ID error:", error);
    return NextResponse.json({ error: "Failed to fetch doctor" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const doctor = await db.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    // Status toggles
    if (typeof body.isOnline === "boolean") updateData.isOnline = body.isOnline;
    if (typeof body.isBlocked === "boolean") {
      updateData.isBlocked = body.isBlocked;
      updateData.blockReason = body.isBlocked ? (body.blockReason || "Blocked by admin") : null;
    }
    if (typeof body.verified === "boolean") updateData.verified = body.verified;

    // Profile fields
    if (body.name) updateData.name = body.name;
    if (body.email) updateData.email = body.email;
    if (body.phone) updateData.phone = body.phone;
    if (body.specialty) updateData.specialty = body.specialty;
    if (body.qualifications !== undefined) updateData.qualifications = body.qualifications;
    if (body.experience !== undefined) updateData.experience = Number(body.experience);
    if (body.area !== undefined) updateData.area = body.area;
    if (body.feeOnline !== undefined) updateData.feeOnline = Number(body.feeOnline);
    if (body.feeAtHome !== undefined) updateData.feeAtHome = Number(body.feeAtHome);
    if (body.commissionRate !== undefined) updateData.commissionRate = Number(body.commissionRate);
    if (body.languages) updateData.languages = typeof body.languages === "string" ? body.languages : JSON.stringify(body.languages);
    if (body.bio !== undefined) updateData.bio = body.bio;

    const updated = await db.doctor.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Doctor PUT error:", error);
    return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 });
  }
}