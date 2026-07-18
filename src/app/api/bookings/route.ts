import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const mode = searchParams.get("mode");
    const status = searchParams.get("status");
    const service = searchParams.get("service");
    const doctorId = searchParams.get("doctorId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "100")));

    const where: Record<string, unknown> = {};

    if (type) where.bookingType = type;
    if (mode) where.consultationMode = mode;
    if (status) where.status = status;
    if (doctorId) where.doctorId = doctorId;

    if (service) {
      where.service = { name: service };
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) (where.date as Record<string, unknown>).gte = dateFrom;
      if (dateTo) (where.date as Record<string, unknown>).lte = dateTo;
    }

    if (search) {
      where.OR = [
        { bookingId: { contains: search } },
        { patientName: { contains: search } },
        { patient: { name: { contains: search } } },
        { doctor: { name: { contains: search } } },
      ];
    }

    const [bookings, total] = await Promise.all([
      db.booking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { id: true, uhid: true, name: true, phone: true } },
          doctor: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
          caregiver: { select: { name: true } },
        },
      }),
      db.booking.count({ where }),
    ]);

    const data = bookings.map((b) => ({
      id: b.id,
      bookingId: b.bookingId,
      patientId: b.patientId,
      patientName: b.patient.name,
      patientUhid: b.patient.uhid,
      patientPhone: b.patientPhone || b.patient.phone,
      doctorId: b.doctorId,
      doctorName: b.doctor?.name ?? null,
      serviceId: b.serviceId,
      serviceName: b.service.name,
      caregiverName: b.caregiver?.name ?? null,
      type: b.bookingType,
      mode: b.consultationMode,
      status: b.status,
      source: b.source,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      amount: b.totalAmount,
      commissionAmount: b.commissionAmount,
      doctorEarnings: b.doctorEarnings,
      address: b.address,
      city: b.city,
      pincode: b.pincode,
      notes: b.notes,
      createdAt: b.createdAt,
    }));

    return NextResponse.json({ bookings: data, total, page, limit });
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}