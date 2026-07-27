import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reviews - Fetch reviews (optionally filter by doctorId or patientId)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const patientId = searchParams.get("patientId");
    const bookingId = searchParams.get("bookingId");

    const where: Record<string, string> = {};
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (bookingId) where.bookingId = bookingId;

    const reviews = await db.review.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: {
        doctor: { select: { name: true, specialty: true } },
        patient: { select: { name: true } },
        booking: { select: { id: true, bookingType: true, date: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Reviews GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/reviews - Create a new review
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, doctorId, patientId, rating, comment } = body;

    if (!bookingId || !doctorId || !patientId || !rating) {
      return NextResponse.json(
        { error: "bookingId, doctorId, patientId, and rating are required" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if review already exists for this booking
    const existing = await db.review.findUnique({ where: { bookingId } });
    if (existing) {
      return NextResponse.json(
        { error: "Review already exists for this booking" },
        { status: 409 }
      );
    }

    const review = await db.review.create({
      data: {
        bookingId,
        doctorId,
        patientId,
        rating,
        comment: comment ?? null,
      },
    });

    // Update doctor's average rating
    const allReviews = await db.review.findMany({
      where: { doctorId },
      select: { rating: true },
    });
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await db.doctor.update({
      where: { id: doctorId },
      data: { avgRating: Math.round(avgRating * 10) / 10 },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Review POST error:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}