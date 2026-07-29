import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const DOCTOR_DOC_TYPES = [
  "Medical License",
  "Degree Certificate",
  "ID Proof",
  "Registration Certificate",
  "Address Proof",
];

const CAREGIVER_DOC_TYPES = [
  "Aadhaar Card",
  "Police Verification",
  "Medical Fitness Certificate",
  "Experience Certificate",
  "Address Proof",
  "Photo",
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // 'doctor' | 'caregiver' | null (all)

    const where = type && ["doctor", "caregiver"].includes(type) ? { entityType: type } : {};

    const verifications = await db.verification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Fetch entity names in batches
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
            select: { id: true, name: true, phone: true, specialty: true },
          })
        : [],
      caregiverIds.length > 0
        ? db.caregiver.findMany({
            where: { id: { in: caregiverIds } },
            select: { id: true, name: true, phone: true, specialty: true },
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

      let parsedDocs: { type: string; url: string; verified?: boolean }[] = [];
      try {
        parsedDocs = JSON.parse(v.documents || "[]");
      } catch {
        parsedDocs = [];
      }

      const docTypes = v.entityType === "doctor" ? DOCTOR_DOC_TYPES : CAREGIVER_DOC_TYPES;

      return {
        id: v.id,
        entityType: v.entityType,
        entityId: v.entityId,
        entityName: entity?.name ?? "Unknown",
        entityPhone: entity?.phone ?? "",
        entitySpecialty: entity?.specialty ?? "",
        status: v.status,
        package: v.package,
        documents: parsedDocs,
        docTypes,
        reviewNotes: v.reviewNotes,
        reviewedBy: v.reviewedBy,
        reviewedAt: v.reviewedAt,
        createdAt: v.createdAt,
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
