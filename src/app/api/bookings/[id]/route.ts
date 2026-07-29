import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { caregiverId, status, notes } = body;

    const booking = await db.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (caregiverId !== undefined) data.caregiverId = caregiverId;
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;

    // If assigning a caregiver, also confirm the booking
    if (caregiverId && !booking.caregiverId) {
      data.status = status || "confirmed";
    }

    const updated = await db.booking.update({ where: { id }, data });
    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error("Booking PATCH error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await db.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    await db.booking.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Booking DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
