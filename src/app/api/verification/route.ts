import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Per NMC (National Medical Commission) India guidelines
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

    const where =
      type && ["doctor", "caregiver"].includes(type)
        ? { entityType: type }
        : {};

    const verifications = await db.verification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const doctorIds = verifications
      .filter((v) => v.entityType === "doctor")
      .map((v) => v.entityId);
    const caregiverIds = verifications
      .filter((v) => v.entityType === "caregiver")
      .map((v) => v.entityId);

    const [doctors, caregivers] = await Promise.all([
      doctorIds.length > 0
        ? db.doctor.findMany({
            where: { id: { in: doctorIds } },
            select: {
              id: true, name: true, phone: true, email: true,
              specialty: true, qualifications: true, experience: true,
              feeOnline: true, feeAtHome: true,
              verified: true, isSuspended: true, suspensionReason: true,
              isBlocked: true, isOnline: true,
            },
          })
        : [],
      caregiverIds.length > 0
        ? db.caregiver.findMany({
            where: { id: { in: caregiverIds } },
            select: {
              id: true, name: true, phone: true, email: true,
              specialty: true, qualifications: true, experience: true,
              isVerified: true, isSuspended: true, suspensionReason: true,
              aadhaarVerified: true, policeVerified: true, medicalFitness: true, videoVerified: true,
            },
          })
        : [],
    ]);

    const doctorMap = Object.fromEntries(doctors.map((d) => [d.id, d]));
    const caregiverMap = Object.fromEntries(caregivers.map((c) => [c.id, c]));

    const data = verifications.map((v) => {
      const entity =
        v.entityType === "doctor"
          ? doctorMap[v.entityId]
          : caregiverMap[v.entityId];

      let parsedDocs: {
        type: string;
        url: string;
        verified?: boolean;
        uploadedAt?: string;
        rejectedAt?: string;
        rejectionReason?: string;
      }[] = [];
      try {
        parsedDocs = JSON.parse(v.documents || "[]");
      } catch {
        parsedDocs = [];
      }

      const docTypes =
        v.entityType === "doctor" ? DOCTOR_DOC_TYPES : CAREGIVER_DOC_TYPES;

      const mandatoryKeys = docTypes.mandatory.map((d) => d.key);
      const uploadedDocs = parsedDocs.map((d) => d.type);
      const mandatoryPending = mandatoryKeys.filter(
        (k) => !uploadedDocs.includes(k)
      );

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
        // Doctor-specific
        feeOnline: v.entityType === "doctor" ? (entity as any)?.feeOnline ?? 0 : null,
        feeAtHome: v.entityType === "doctor" ? (entity as any)?.feeAtHome ?? 0 : null,
        isOnline: v.entityType === "doctor" ? (entity as any)?.isOnline ?? false : null,
        // Caregiver-specific
        caregiverChecks:
          v.entityType === "caregiver"
            ? {
                aadhaarVerified: (entity as any)?.aadhaarVerified ?? false,
                policeVerified: (entity as any)?.policeVerified ?? false,
                medicalFitness: (entity as any)?.medicalFitness ?? false,
                videoVerified: (entity as any)?.videoVerified ?? false,
              }
            : null,
        // Verification state
        status: v.status,
        package: v.package,
        documents: parsedDocs,
        docTypes,
        mandatoryPending,
        mandatoryCount: mandatoryKeys.length,
        uploadedCount: uploadedDocs.length,
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
  } catch (error) {
    console.error("Verification GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch verifications" },
      { status: 500 }
    );
  }
}
