import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DOCTOR_DOC_TYPES = {
  mandatory: [
    { key: "medical_degree", label: "Medical Degree (MBBS/MD/MS)" },
    { key: "nmc_registration", label: "NMC / State Medical Council Registration" },
    { key: "govt_id", label: "Government ID (Aadhaar/PAN/Passport)" },
    { key: "passport_photo", label: "Passport-size Photograph" },
  ],
  optional: [
    { key: "clinic_registration", label: "Clinic / Hospital Registration" },
    { key: "gst_registration", label: "GST Registration Certificate" },
    { key: "specialization_cert", label: "Specialization / Super-specialty Certificate" },
    { key: "experience_cert", label: "Experience Certificate" },
  ],
};

const CAREGIVER_DOC_TYPES = {
  mandatory: [
    { key: "aadhaar_card", label: "Aadhaar Card" },
    { key: "police_verification", label: "Police Verification Certificate" },
    { key: "medical_fitness", label: "Medical Fitness Certificate" },
    { key: "address_proof", label: "Address Proof" },
  ],
  optional: [
    { key: "education_cert", label: "Education / Qualification Certificate" },
    { key: "experience_cert", label: "Experience Certificate" },
    { key: "reference_letter", label: "Reference Letter" },
    { key: "video_introduction", label: "Video Introduction" },
  ],
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    if (type === "doctor") {
      const rows: any = await prisma.$queryRawUnsafe(
        'SELECT dp.id, dp."userId", dp.specialization, dp.degree, dp."experienceYears", dp."consultationFeeOnline", dp."consultationFeeOffline", dp.area, dp.languages, dp."availableDays", dp.bio, dp."profileComplete", dp."isActive", dp."practiceType", dp."createdAt", u.name, u.email, u.phone FROM "DoctorProfile" dp JOIN "User" u ON dp."userId" = u.id ORDER BY dp."createdAt" DESC'
      );

      const data = rows.map((r: any) => ({
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
        docTypes: DOCTOR_DOC_TYPES,
        mandatoryPending: DOCTOR_DOC_TYPES.mandatory.map((d) => d.key),
        mandatoryCount: DOCTOR_DOC_TYPES.mandatory.length,
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
      }));

      return NextResponse.json({ data });
    }

    const verifications: any = await (prisma as any).verification.findMany({
      where: type === "caregiver" ? { entityType: "caregiver" } : {},
      orderBy: { createdAt: "desc" },
    });

    const caregiverIds = verifications
      .filter((v: any) => v.entityType === "caregiver")
      .map((v: any) => v.entityId);

    const caregivers =
      caregiverIds.length > 0
        ? await (prisma as any).caregiver.findMany({
            where: { id: { in: caregiverIds } },
            select: {
              id: true, name: true, phone: true, email: true,
              specialty: true, qualifications: true, experience: true,
              isVerified: true, isSuspended: true, suspensionReason: true,
              aadhaarVerified: true, policeVerified: true, medicalFitness: true, videoVerified: true,
            },
          })
        : [];

    const caregiverMap = Object.fromEntries(caregivers.map((c: any) => [c.id, c]));

    const data = verifications.map((v: any) => {
      const entity = caregiverMap[v.entityId];
      let rawDocs: any[] = [];
      try { rawDocs = JSON.parse(v.documents || "[]"); } catch { rawDocs = []; }

      return {
        id: v.id,
        entityType: v.entityType,
        entityId: v.entityId,
        entityName: entity?.name ?? "Unknown",
        entityPhone: entity?.phone ?? "",
        entityEmail: entity?.email ?? "",
        entitySpecialty: entity?.specialty ?? "",
        entityQualifications: entity?.qualifications ?? "",
        entityExperience: entity?.experience ?? 0,
        feeOnline: null,
        feeAtHome: null,
        isOnline: null,
        caregiverChecks: entity
          ? {
              aadhaarVerified: entity.aadhaarVerified ?? false,
              policeVerified: entity.policeVerified ?? false,
              medicalFitness: entity.medicalFitness ?? false,
              videoVerified: entity.videoVerified ?? false,
            }
          : null,
        status: v.status,
        package: v.package,
        documents: rawDocs,
        docTypes: CAREGIVER_DOC_TYPES,
        mandatoryPending: CAREGIVER_DOC_TYPES.mandatory.map((d: any) => d.key).filter((k: string) => !rawDocs.some((d: any) => d.type === k)),
        mandatoryCount: CAREGIVER_DOC_TYPES.mandatory.length,
        uploadedCount: rawDocs.length,
        attemptCount: v.attemptCount ?? 1,
        attemptsRemaining: Math.max(0, 3 - (v.attemptCount ?? 1)),
        isSuspended: v.isSuspended ?? false,
        suspensionReason: v.suspensionReason ?? null,
        reviewNotes: v.reviewNotes,
        reviewedBy: v.reviewedBy,
        reviewedAt: v.reviewedAt,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Verification GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
