import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status");

    if (!doctorId) {
      return NextResponse.json({ error: "doctorId is required" }, { status: 400 });
    }

    const where: Record<string, unknown> = { doctorId };
    if (status) where.status = status;

    const bookings = await db.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        patient: { select: { uhid: true, name: true, phone: true } },
        service: { select: { name: true } },
      },
    });

    const data = bookings.map((b) => ({
      id: b.id,
      bookingId: b.bookingId,
      patientName: b.patient.name,
      patientUhid: b.patient.uhid,
      patientPhone: b.patient.phone,
      serviceName: b.service.name,
      bookingType: b.bookingType,
      consultationMode: b.consultationMode,
      status: b.status,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      totalAmount: b.totalAmount,
      doctorEarnings: b.doctorEarnings,
      notes: b.notes,
      createdAt: b.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Doctor portal bookings error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}