import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const doctor = await db.doctor.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        qualifications: true,
        experience: true,
        languages: true,
        area: true,
        avatar: true,
        bio: true,
        feeOnline: true,
        feeAtHome: true,
        isOnline: true,
        isPortalUser: true,
        isBlocked: true,
        commissionRate: true,
        avgRating: true,
        verified: true,
        password: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (doctor.isBlocked) {
      return NextResponse.json({ error: "Account is blocked" }, { status: 403 });
    }

    if (!doctor.isPortalUser) {
      return NextResponse.json({ error: "Portal access not enabled" }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, doctor.password);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { password: _, ...doctorData } = doctor;

    return NextResponse.json({ doctor: doctorData });
  } catch (error) {
    console.error("Doctor portal auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}