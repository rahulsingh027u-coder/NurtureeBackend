import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") ?? "";
    const userType = searchParams.get("userType") ?? "admin";

    const notifications = await db.notification.findMany({
      where: { userId, userType },
      orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return NextResponse.json({ data: notifications, unreadCount });
  } catch (error) {
    console.error("Notifications GET error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}