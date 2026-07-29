import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const MAX_ATTEMPTS = 3;

// ── Admin approve/reject ──
async function handleReview(
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

    if (verification.status === "approved") {
      return NextResponse.json({ error: "Already approved" }, { status: 400 });
    }
    if (verification.isSuspended) {
      return NextResponse.json(
        { error: "Account is suspended. Unsuspend first before reviewing." },
        { status: 400 }
      );
    }

    let newStatus = status;
    let newAttemptCount = verification.attemptCount ?? 1;
    let newIsSuspended = verification.isSuspended ?? false;
    let newSuspensionReason: string | null = verification.suspensionReason ?? null;

    if (status === "rejected") {
      newAttemptCount = (verification.attemptCount ?? 1) + 1;
      if (newAttemptCount > MAX_ATTEMPTS) {
        newStatus = "suspended";
        newIsSuspended = true;
        newSuspensionReason =
          reviewNotes ||
          "Maximum verification attempts (3) exceeded. Account suspended pending mandatory re-verification.";
      } else {
        newStatus = "rejected";
      }
    } else if (status === "approved") {
      newStatus = "approved";
      newIsSuspended = false;
      newSuspensionReason = null;
    }

    const updated = await db.verification.update({
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

    if (verification.entityType === "doctor") {
      await db.doctor.update({
        where: { id: verification.entityId },
        data: { verified: newStatus === "approved", isSuspended: newIsSuspended, suspensionReason: newSuspensionReason },
      });
    } else if (verification.entityType === "caregiver") {
      await db.caregiver.update({
        where: { id: verification.entityId },
        data: { isVerified: newStatus === "approved", isSuspended: newIsSuspended, suspensionReason: newSuspensionReason },
      });
    }

    return NextResponse.json({
      ...updated,
      _meta: {
        wasSuspended: newIsSuspended,
        attemptsUsed: newAttemptCount,
        attemptsRemaining: Math.max(0, MAX_ATTEMPTS - newAttemptCount),
      },
    });
  } catch (error) {
    console.error("Verification review error:", error);
    return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
  }
}

// ── Doctor/Caregiver resubmit after rejection ──
async function handleResubmit(
  body: { documents?: any[] },
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { documents } = body;

    if (!Array.isArray(documents) || documents.length === 0) {
      return NextResponse.json({ error: "At least one document is required" }, { status: 400 });
    }

    const verification = await db.verification.findUnique({ where: { id } });
    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    if (verification.status !== "rejected") {
      return NextResponse.json({ error: `Cannot resubmit. Current status: ${verification.status}` }, { status: 400 });
    }
    if (verification.isSuspended) {
      return NextResponse.json({ error: "Account is suspended. Contact admin for re-activation." }, { status: 400 });
    }

    let existingDocs: any[] = [];
    try { existingDocs = JSON.parse(verification.documents || "[]"); } catch { existingDocs = []; }

    const existingMap = new Map(existingDocs.map((d: any) => [d.type, d]));
    for (const doc of documents) {
      existingMap.set(doc.type, {
        ...existingMap.get(doc.type),
        type: doc.type,
        url: doc.url,
        verified: false,
        uploadedAt: new Date().toISOString(),
        rejectedAt: undefined,
        rejectionReason: undefined,
      });
    }

    const updated = await db.verification.update({
      where: { id },
      data: { status: "resubmitted", documents: JSON.stringify(Array.from(existingMap.values())) },
    });

    return NextResponse.json({
      success: true,
      id: updated.id,
      status: updated.status,
      attemptCount: updated.attemptCount,
      attemptsRemaining: Math.max(0, MAX_ATTEMPTS - (updated.attemptCount ?? 1)),
    });
  } catch (error) {
    console.error("Verification resubmit error:", error);
    return NextResponse.json({ error: "Failed to resubmit verification" }, { status: 500 });
  }
}

// ── Admin unsuspend a suspended account ──
async function handleUnsuspend(
  body: { notes?: string },
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { notes } = body;

    const verification = await db.verification.findUnique({ where: { id } });
    if (!verification) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }
    if (!verification.isSuspended) {
      return NextResponse.json({ error: "Account is not suspended" }, { status: 400 });
    }

    const updated = await db.verification.update({
      where: { id },
      data: {
        status: "pending",
        isSuspended: false,
        suspensionReason: null,
        attemptCount: 0,
        reviewNotes: notes
          ? `Unsuspended: ${notes}. Previous: ${verification.reviewNotes || "N/A"}`
          : `Unsuspended by admin. Previous: ${verification.reviewNotes || "N/A"}`,
        reviewedBy: "admin",
        reviewedAt: new Date(),
      },
    });

    if (verification.entityType === "doctor") {
      await db.doctor.update({ where: { id: verification.entityId }, data: { isSuspended: false, suspensionReason: null } });
    } else if (verification.entityType === "caregiver") {
      await db.caregiver.update({ where: { id: verification.entityId }, data: { isSuspended: false, suspensionReason: null } });
    }

    return NextResponse.json({
      success: true, id: updated.id, status: updated.status,
      message: "Account unsuspended. User can now re-submit documents for verification.",
    });
  } catch (error) {
    console.error("Verification unsuspend error:", error);
    return NextResponse.json({ error: "Failed to unsuspend" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === "resubmit") {
      return handleResubmit(body, { params });
    } else if (action === "unsuspend") {
      return handleUnsuspend(body, { params });
    } else {
      return NextResponse.json({ error: "Invalid action. Use 'resubmit' or 'unsuspend'." }, { status: 400 });
    }
  } catch (error) {
    console.error("Verification POST error:", error);
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

export { handleReview as PUT, handleReview as PATCH };
