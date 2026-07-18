import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.max(1, Math.min(365, parseInt(searchParams.get("days") ?? "30")));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const startDateStr = startDate.toISOString().split("T")[0];

    const bookings = await db.booking.findMany({
      where: {
        date: { gte: startDateStr },
      },
      select: { date: true },
    });

    const dateMap: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - days + 1 + i);
      const key = d.toISOString().split("T")[0];
      dateMap[key] = 0;
    }

    for (const b of bookings) {
      if (dateMap[b.date] !== undefined) {
        dateMap[b.date]++;
      }
    }

    const data = Object.entries(dateMap).map(([date, count]) => ({ date, count }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Bookings per day error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings per day" }, { status: 500 });
  }
}