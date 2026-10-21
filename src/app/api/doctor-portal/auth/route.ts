import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const portalSecret = new TextEncoder().encode(
  process.env.SIGNAL_JWT_SECRET ?? ""
);

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const doctor = await db.doctor.findUnique({
    where: { email },
    select: {
      id: true, name: true, email: true, phone: true,
      specialty: true, qualifications: true, experience: true,
      languages: true, area: true, avatar: true, bio: true,
      feeOnline: true, feeAtHome: true, isOnline: true,
      isPortalUser: true, isBlocked: true, commissionRate: true,
      avgRating: true, verified: true, password: true,
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

  const valid = await bcrypt.compare(password, doctor.password);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // P0-6: Block login for unverified doctors.
  if (!doctor.verified) {
    return NextResponse.json(
      {
        error: "Account pending verification. Please complete document verification before logging in.",
        code: "PENDING_VERIFICATION",
      },
      { status: 403 }
    );
  }

  const { password: _, ...doctorData } = doctor;

  const token = portalSecret.length
    ? await new SignJWT({ id: doctor.id, role: "doctor" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setIssuer("nurturee")
        .setExpirationTime("24h")
        .sign(portalSecret)
    : null;

  return NextResponse.json({ doctor: doctorData, token });
}
