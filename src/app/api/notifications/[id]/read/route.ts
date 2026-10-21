import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// P0-9: Mark a single notification as read.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.headers.get("x-user-id") || "";

    const notification = await db.notification.findUnique({ where: { id } });
    if (!notification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    if (notification.userId && notification.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await db.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, notification: updated });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return NextResponse.json({ error: "Failed to mark notification as read" }, { status: 500 });
  }
}
