import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function generateUhid(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.floor(10000 + Math.random() * 90000);
  return `NUR-P-${year}${month}-${random}`;
}

async function generateBookingId(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const todayStr = now.toISOString().split("T")[0];

  const todayCount = await db.booking.count({
    where: { date: todayStr },
  });

  const seq = (todayCount + 1).toString().padStart(5, "0");
  return `NUR-B-${year}-${seq}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patientName,
      patientPhone,
      patientEmail,
      serviceId,
      doctorId,
      bookingType,
      consultationMode,
      date,
      startTime,
      endTime,
      address,
      city,
      pincode,
      landmark,
      notes,
    } = body;

    if (!patientName || !patientPhone || !serviceId || !bookingType || !date || !startTime) {
      return NextResponse.json(
        { error: "patientName, patientPhone, serviceId, bookingType, date, and startTime are required" },
        { status: 400 }
      );
    }

    // Find or create patient
    let patient = await db.patient.findFirst({
      where: { phone: patientPhone },
    });

    if (!patient) {
      let uhid = generateUhid();
      // Ensure unique UHID
      while (await db.patient.findUnique({ where: { uhid } })) {
        uhid = generateUhid();
      }
      patient = await db.patient.create({
        data: {
          uhid,
          name: patientName,
          phone: patientPhone,
          email: patientEmail ?? null,
          address: address ?? null,
          city: city ?? "Gurugram",
          pincode: pincode ?? null,
          landmark: landmark ?? null,
        },
      });
    }

    // Get service pricing
    const service = await db.service.findUnique({ where: { id: serviceId } });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    let totalAmount = 0;
    if (consultationMode === "online" && service.priceOnline != null) {
      totalAmount = service.priceOnline;
    } else if (consultationMode === "in_home" && service.priceAtHome != null) {
      totalAmount = service.priceAtHome;
    } else if (service.price != null) {
      totalAmount = service.price;
    }

    // If doctor is specified, use doctor's fee as fallback
    if (doctorId && totalAmount === 0) {
      const doctor = await db.doctor.findUnique({ where: { id: doctorId } });
      if (doctor) {
        totalAmount =
          consultationMode === "online" ? doctor.feeOnline : doctor.feeAtHome;
      }
    }

    const bookingId = await generateBookingId();

    // Calculate commission if doctor exists
    let commissionRate = 0;
    let commissionAmount = 0;
    let doctorEarnings = 0;

    if (doctorId) {
      const doctor = await db.doctor.findUnique({ where: { id: doctorId } });
      if (doctor) {
        commissionRate = doctor.commissionRate;
        commissionAmount = (totalAmount * commissionRate) / 100;
        doctorEarnings = totalAmount - commissionAmount;
      }
    }

    const booking = await db.booking.create({
      data: {
        bookingId,
        patientId: patient.id,
        doctorId: doctorId ?? null,
        serviceId,
        bookingType,
        consultationMode: consultationMode ?? "in_home",
        date,
        startTime,
        endTime: endTime ?? null,
        patientName,
        patientPhone,
        address: address ?? null,
        city: city ?? null,
        pincode: pincode ?? null,
        notes: notes ?? null,
        totalAmount,
        commissionAmount,
        doctorEarnings,
        source: "website",
      },
    });

    // Create commission record if doctor exists
    if (doctorId && commissionAmount > 0) {
      await db.commission.create({
        data: {
          bookingId: booking.id,
          doctorId,
          totalAmount,
          commissionRate,
          commissionAmount,
          doctorEarnings,
        },
      });
    }

    return NextResponse.json({
      booking,
      patient: {
        id: patient.id,
        uhid: patient.uhid,
        name: patient.name,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("Patient portal booking error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}