import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const specialty = searchParams.get("specialty");
    const available = searchParams.get("available");
    const verified = searchParams.get("verified");

    const where: Record<string, unknown> = {};
    if (specialty) where.specialty = specialty;
    if (available === "true") where.isAvailable = true;
    else if (available === "false") where.isAvailable = false;
    if (verified === "true") where.isVerified = true;
    else if (verified === "false") where.isVerified = false;

    const caregivers = await db.caregiver.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { bookings: true } },
      },
    });

    const data = caregivers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      specialty: c.specialty,
      experience: c.experience,
      qualifications: c.qualifications,
      isAvailable: c.isAvailable,
      isVerified: c.isVerified,
      rating: c.rating,
      aadhaarVerified: c.aadhaarVerified,
      policeVerified: c.policeVerified,
      medicalFitness: c.medicalFitness,
      videoVerified: c.videoVerified,
      bookingCount: c._count.bookings,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Caregivers GET error:", error);
    return NextResponse.json({ error: "Failed to fetch caregivers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, specialty, experience, qualifications } = body;

    if (!name || !phone || !specialty) {
      return NextResponse.json(
        { error: "Name, phone, and specialty are required" },
        { status: 400 }
      );
    }

    const caregiver = await db.caregiver.create({
      data: {
        name,
        phone,
        email: email ?? null,
        specialty,
        experience: experience ?? 0,
        qualifications: qualifications ?? null,
      },
    });

    return NextResponse.json(caregiver, { status: 201 });
  } catch (error) {
    console.error("Caregivers POST error:", error);
    return NextResponse.json({ error: "Failed to create caregiver" }, { status: 500 });
  }
}