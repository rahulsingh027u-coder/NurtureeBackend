import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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