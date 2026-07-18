import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") ?? "20")));

    const where: Record<string, unknown> = {};
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;

    const [prescriptions, total] = await Promise.all([
      db.prescription.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          doctor: { select: { name: true } },
          patient: { select: { name: true, uhid: true } },
        },
      }),
      db.prescription.count({ where }),
    ]);

    const data = prescriptions.map((p) => ({
      id: p.id,
      bookingId: p.bookingId,
      doctorName: p.doctor.name,
      patientName: p.patient.name,
      patientUhid: p.patient.uhid,
      diagnosis: p.diagnosis,
      medications: p.medications,
      notes: p.notes,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("Prescriptions GET error:", error);
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
  }
}