import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// P0-9: Bulk mark all notifications as read for a given user.
// Body: { userType?: "admin" | "doctor" | "caregiver" }
// Uses x-user-id from middleware (admin JWT) to scope the update.
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id") || "";
    let body: { userType?: string } = {};
    try {
      body = await req.json();
    } catch {
      // empty body is fine — default to admin
    }
    const userType = body.userType || "admin";

    const result = await db.notification.updateMany({
      where: { userId, userType, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      markedRead: result.count,
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return NextResponse.json({ error: "Failed to mark notifications as read" }, { status: 500 });
  }
}
