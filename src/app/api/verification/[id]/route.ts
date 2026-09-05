import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function isDoctorProfileId(id: string): Promise<boolean> {
  try {
    const result: any = await prisma.$queryRawUnsafe(
      'SLECT id FROM "DoctorProfile" WHERE id = $1 LIMIT 1',
      id
    );
    return result.length > 0;
  } catch {
    return false;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const isDoctor = await isDoctorProfileId(id);

    if (isDoctor) {
      const rows: any = await prisma.$queryRawUnsafe(
        'SELECT dp.*, u.name, u.email, u.phone FROM "DoctorProfile" dp JOIN "User" u ON dp."userId" = u.id WHERE dp.id = $1',
        id
      );
      if (!rows || rows.length === 0)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      const r = rows[0];
      return NextResponse.json({
        data: {
          id: r.id,
          entityType: "doctor",
          entityId: r.id,
          entityName: r.name,
          entityPhone: r.phone,
          entityEmail: r.email,
          entitySpecialty: r.specialization,
          entityQualifications: r.degree,
          entityExperience: r.experienceYears,
          feeOnline: r.consultationFeeOnline,
          feeAtHome: r.consultationFeeOffline,
          isOnline: r.practiceType === "online" || r.practiceType === "both",
          caregiverChecks: null,
          status: r.isActive ? "approved" : "pending",
          package: null,
          documents: [],
          docTypes: {
            mandatory: [
              { key: "medical_degree", label: "Medical Degree (MBBS/MD/MS)" },
              { key: "nmc_registration", label: "NMC / State Medical Council Registration" },
              { key: "govt_id", label: "Government ID (Aadhaar/PAN/Passport)" },
              { key: "passport_photo", label: "Passport-size Photograph" },
            ],
            optional: [],
          },
          mandatoryPending: ["medical_degree", "nmc_registration", "govt_id", "passport_photo"],
          mandatoryCount: 4,
          uploadedCount: 0,
          attemptCount: 1,
          attemptsRemaining: 2,
          isSuspended: false,
          suspensionReason: null,
          reviewNotes: null,
          reviewedBy: null,
          reviewedAt: null,
          createdAt: r.createdAt,
          updatedAt: r.createdAt,
        },
      });
    }

    const verification: any = await (prisma as any).verification.findUnique({
      where: { id },
    });
    if (!verification)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: verification });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, reviewNotes, reviewedBy } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rjected'" },
        { status: 400 }
      );
    }

    const isDoctor = await isDoctorProfileId(id);

    if (isDoctor) {
      const isActive = status === "approved";
      await prisma.$queryRawUnsafe(
        'UPDATE "DoctorProfile" SET "isActive" = $1 WHERE id = $2',
        isActive,
        id
      );
      return NextResponse.json({ success: true, status });
    }

    const verification: any = await (prisma as any).verification.findUnique({
      where: { id },
    });
    if (!verification)
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    if (verification.status === "approved")
      return NextResponse.json({ error: "Already approved" }, { status: 400 });

    const MAX_ATTEMPTS = 3;
    let newStatus = status;
    let newAttemptCount = (verification.attemptCount ?? 1) + (status === "rejected" ? 1 : 0);
    let newIsSuspended = verification.isSuspended ?? false;
    let newSuspensionReason: string | null = verification.suspensionReason ?? null;

    if (status === "rejected" && newAttemptCount > MAX_ATTEMPTS) {
      newStatus = "suspended";
      newIsSuspended = true;
      newSuspensionReason = reviewNotes || "Maximum verification attempts exceeded.";
    }

    const updated = await (prisma as any).verification.update({
      where: { id },
      data: {
        status: newStatus,
        reviewNotes: reviewNotes ?? null,
        reviewedBy: reviewedBy ?? null,
        reviewedAt: new Date(),
        attemptCount: newAttemptCount,
        isSuspended: newIsSuspended,
        suspensionReason: newSuspensionReason,
      },
    });

    if (verification.entityType === "caregiver") {
      await (prisma as any).caregiver.update({
        where: { id: verification.entityId },
        data: {
          isVerified: newStatus === "approved",
          isSuspended: newIsSuspended,
          suspensionReason: newSuspensionReason,
        },
      });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
