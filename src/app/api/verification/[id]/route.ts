import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, reviewNotes, reviewedBy } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const verification = await db.verification.findUnique({ where: { id } });
    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    const updated = await db.verification.update({
      where: { id },
      data: {
        status,
        reviewNotes: reviewNotes ?? null,
        reviewedBy: reviewedBy ?? null,
        reviewedAt: new Date(),
      },
    });

    // If approved, also update the entity's verified status
    if (status === "approved") {
      if (verification.entityType === "doctor") {
        await db.doctor.update({
          where: { id: verification.entityId },
          data: { verified: true },
        });
      } else if (verification.entityType === "caregiver") {
        await db.caregiver.update({
          where: { id: verification.entityId },
          data: { isVerified: true },
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Verification PATCH error:", error);
    return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
  }
}