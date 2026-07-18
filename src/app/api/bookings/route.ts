import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const mode = searchParams.get("mode");
    const status = searchParams.get("status");
    const doctorId = searchParams.get("doctorId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "20")));

    const where: Record<string, unknown> = {};

    if (type) where.bookingType = type;
    if (mode) where.consultationMode = mode;
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) (where.date as Record<string, unknown>).gte = dateFrom;
      if (dateTo) (where.date as Record<string, unknown>).lte = dateTo;
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { uhid: true, name: true } },
          doctor: { select: { name: true } },
          service: { select: { name: true } },
          caregiver: { select: { name: true } },
        },
      }),
      db.booking.count({ where }),
    ]);

    const data = bookings.map((b) => ({
      id: b.id,
      bookingId: b.bookingId,
      patientName: b.patient.name,
      patientUhid: b.patient.uhid,
      doctorName: b.doctor?.name ?? "N/A",
      serviceName: b.service.name,
      caregiverName: b.caregiver?.name ?? "N/A",
      bookingType: b.bookingType,
      consultationMode: b.consultationMode,
      status: b.status,
      source: b.source,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      totalAmount: b.totalAmount,
      commissionAmount: b.commissionAmount,
      createdAt: b.createdAt,
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}