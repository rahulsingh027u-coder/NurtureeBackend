import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      doctorId,
      patientId,
      patientUhid,
      diagnosis,
      medications,
      notes,
    } = body;

    if (!bookingId || !doctorId || !patientId || !patientUhid) {
      return NextResponse.json(
        { error: "bookingId, doctorId, patientId, and patientUhid are required" },
        { status: 400 }
      );
    }

    // Check if prescription already exists for this booking
    const existing = await db.prescription.findUnique({ where: { bookingId } });
    if (existing) {
      return NextResponse.json(
        { error: "Prescription already exists for this booking" },
        { status: 409 }
      );
    }

    const prescription = await db.prescription.create({
      data: {
        bookingId,
        doctorId,
        patientId,
        patientUhid,
        diagnosis: diagnosis ?? null,
        medications: medications ? JSON.stringify(medications) : "[]",
        notes: notes ?? null,
      },
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("Doctor portal prescription error:", error);
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 });
  }
}