import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.max(1, Math.min(365, parseInt(searchParams.get("days") ?? "30")));

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    const startDateStr = startDate.toISOString().split("T")[0];

    const completedBookings = await db.booking.findMany({
      where: {
        status: "completed",
        date: { gte: startDateStr },
      },
      select: {
        totalAmount: true,
        commissionAmount: true,
        date: true,
        doctor: { select: { name: true } },
      },
    });

    const doctorRevenueMap: Record<string, number> = {};
    const dateRevenueMap: Record<string, number> = {};
    let totalRevenue = 0;
    let totalPlatformRevenue = 0;

    for (const b of completedBookings) {
      const doctorName = b.doctor?.name ?? "Unknown";
      doctorRevenueMap[doctorName] = (doctorRevenueMap[doctorName] ?? 0) + b.totalAmount;
      dateRevenueMap[b.date] = (dateRevenueMap[b.date] ?? 0) + b.commissionAmount;
      totalRevenue += b.totalAmount;
      totalPlatformRevenue += b.commissionAmount;
    }

    const doctorRevenue = Object.entries(doctorRevenueMap).map(([doctorName, amount]) => ({
      doctorName,
      amount,
    }));

    const platformRevenue = Object.entries(dateRevenueMap)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      doctorRevenue,
      platformRevenue,
      totalRevenue,
      totalPlatformRevenue,
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue analytics" }, { status: 500 });
  }
}