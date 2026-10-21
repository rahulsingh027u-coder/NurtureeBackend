import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const caregiver = await db.caregiver.findUnique({
      where: { id },
      include: {
        bookings: {
          orderBy: { createdAt: "desc" },
          include: {
            patient: { select: { name: true, uhid: true, phone: true } },
            service: { select: { name: true, category: true } },
          },
        },
      },
    });

    if (!caregiver) {
      return NextResponse.json({ error: "Care Partner not found" }, { status: 404 });
    }

    // Get verification record for this caregiver
    const verification = await db.verification.findFirst({
      where: { entityType: "caregiver", entityId: id },
    });

    let verificationDocs: { type: string; url: string; verified: boolean }[] = [];
    if (verification?.documents) {
      try {
        const parsed =
          typeof verification.documents === "string"
            ? JSON.parse(verification.documents)
            : verification.documents;
        if (Array.isArray(parsed)) verificationDocs = parsed;
      } catch (e) {
        console.warn("Failed to parse verification documents:", e);
      }
    }

    // Compute earnings from bookings
    const completedBookings = caregiver.bookings.filter(
      (b) => b.status === "completed"
    );
    const totalEarnings = completedBookings.reduce(
      (sum, b) => sum + (b.totalAmount || 0),
      0
    );
    const totalCommission = completedBookings.reduce(
      (sum, b) => sum + (b.commissionAmount || 0),
      0
    );
    const netEarnings = totalEarnings - totalCommission;

    // Booking stats
    const statusBreakdown = caregiver.bookings.reduce(
      (acc, b) => {
        acc[b.status] = (acc[b.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Monthly earnings trend (last 6 months)
    const monthlyEarnings: Record<string, number> = {};
    completedBookings.forEach((b) => {
      if (b.date) {
        const monthKey = b.date.substring(0, 7); // YYYY-MM
        monthlyEarnings[monthKey] =
          (monthlyEarnings[monthKey] || 0) + (b.totalAmount || 0);
      }
    });

    // Day-of-week distribution
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayBreakdown: Record<string, number> = {};
    caregiver.bookings.forEach((b) => {
      if (b.date) {
        const d = new Date(b.date + "T00:00:00");
        const dayName = dayNames[d.getDay()];
        dayBreakdown[dayName] = (dayBreakdown[dayName] || 0) + 1;
      }
    });

    return NextResponse.json({
      caregiver: {
        id: caregiver.id,
        caregiverId: caregiver.caregiverId,
        name: caregiver.name,
        phone: caregiver.phone,
        email: caregiver.email,
        specialty: caregiver.specialty,
        experience: caregiver.experience,
        qualifications: caregiver.qualifications,
        isAvailable: caregiver.isAvailable,
        isVerified: caregiver.isVerified,
        rating: caregiver.rating,
        createdAt: caregiver.createdAt,
      },
      verificationStatus: {
        aadhaar: caregiver.aadhaarVerified,
        police: caregiver.policeVerified,
        medical: caregiver.medicalFitness,
        video: caregiver.videoVerified,
      },
      verificationRecord: verification
        ? {
            id: verification.id,
            status: verification.status,
            package: verification.package,
            documents: verificationDocs,
            reviewNotes: verification.reviewNotes,
            reviewedAt: verification.reviewedAt,
            createdAt: verification.createdAt,
          }
        : null,
      pendingVerifications: [
        !caregiver.aadhaarVerified ? "Aadhaar" : null,
        !caregiver.policeVerified ? "Police Verification" : null,
        !caregiver.medicalFitness ? "Medical Fitness" : null,
        !caregiver.videoVerified ? "Video Verification" : null,
      ].filter(Boolean),
      bookings: caregiver.bookings.map((b) => ({
        id: b.id,
        bookingId: b.bookingId,
        patientName: b.patientName,
        patientUhid: b.patient?.uhid ?? null,
        patientPhone: b.patient?.phone ?? null,
        serviceName: b.service?.name ?? null,
        serviceCategory: b.service?.category ?? null,
        type: b.bookingType,
        mode: b.consultationMode,
        status: b.status,
        source: b.source,
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        totalAmount: b.totalAmount,
        commissionAmount: b.commissionAmount,
      })),
      earnings: {
        totalEarnings,
        totalCommission,
        netEarnings,
        completedBookings: completedBookings.length,
        totalBookings: caregiver.bookings.length,
        monthlyEarnings,
      },
      analytics: {
        statusBreakdown,
        dayBreakdown,
        averageRating: caregiver.rating,
        totalReviews: completedBookings.length,
      },
    });
  } catch (error) {
    console.error("Care Partner detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch caregiver details" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { documentType, url } = body as { documentType?: string; url?: string };
    if (!documentType) return NextResponse.json({ error: "documentType is required" }, { status: 400 });
    const caregiver = await db.caregiver.findUnique({ where: { id } });
    if (!caregiver) return NextResponse.json({ error: "Caregiver not found" }, { status: 404 });
    let verification = await db.verification.findFirst({ where: { entityType: "caregiver", entityId: id } });
    const docUrl = url || "/uploads/" + id + "/" + documentType + "-" + Date.now();
    if (!verification) {
      verification = await db.verification.create({ data: { entityType: "caregiver", entityId: id, status: "pending", package: "comprehensive", documents: JSON.stringify([{ type: documentType, url: docUrl, verified: false, uploadedAt: new Date().toISOString() }]) } });
    } else {
      let existingDocs: any[] = [];
      try { existingDocs = JSON.parse(verification.documents || "[]"); } catch { existingDocs = []; }
      const existingMap = new Map(existingDocs.map((d: any) => [d.type, d]));
      existingMap.set(documentType, { type: documentType, url: docUrl, verified: false, uploadedAt: new Date().toISOString() });
      await db.verification.update({ where: { id: verification.id }, data: { documents: JSON.stringify(Array.from(existingMap.values())) } });
    }
    return NextResponse.json({ success: true, message: documentType + " document uploaded", documentType });
  } catch (error) {
    console.error("Caregiver PATCH error:", error);
    return NextResponse.json({ error: "Failed to update caregiver" }, { status: 500 });
  }
}
