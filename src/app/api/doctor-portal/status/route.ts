import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  try {
    const { doctorId, isOnline } = await req.json();

    if (!doctorId || isOnline === undefined) {
      return NextResponse.json(
        { error: "doctorId and isOnline are required" },
        { status: 400 }
      );
    }

    const doctor = await db.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
    }

    const updated = await db.doctor.update({
      where: { id: doctorId },
      data: { isOnline: Boolean(isOnline) },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      isOnline: updated.isOnline,
    });
  } catch (error) {
    console.error("Doctor status update error:", error);
    return NextResponse.json({ error: "Failed to update doctor status" }, { status: 500 });
  }
}