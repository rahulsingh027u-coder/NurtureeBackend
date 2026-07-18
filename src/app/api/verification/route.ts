import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const verifications = await db.verification.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        // We need to look up the entity name based on entityType and entityId
      },
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
            select: { id: true, name: true },
          })
        : [],
      caregiverIds.length > 0
        ? db.caregiver.findMany({
            where: { id: { in: caregiverIds } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const doctorMap = Object.fromEntries(doctors.map((d) => [d.id, d.name]));
    const caregiverMap = Object.fromEntries(caregivers.map((c) => [c.id, c.name]));

    const data = verifications.map((v) => ({
      id: v.id,
      entityType: v.entityType,
      entityId: v.entityId,
      entityName:
        v.entityType === "doctor"
          ? doctorMap[v.entityId] ?? "Unknown"
          : caregiverMap[v.entityId] ?? "Unknown",
      status: v.status,
      package: v.package,
      reviewNotes: v.reviewNotes,
      reviewedBy: v.reviewedBy,
      reviewedAt: v.reviewedAt,
      createdAt: v.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Verification GET error:", error);
    return NextResponse.json({ error: "Failed to fetch verifications" }, { status: 500 });
  }
}