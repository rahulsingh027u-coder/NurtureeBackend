import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.max(1, Math.min(365, parseInt(searchParams.get("days") ?? "30")));
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const dateFilter: Record<string, string | Date> = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;

    // If explicit from/to, use those; otherwise fall back to days
    const whereDate = Object.keys(dateFilter).length > 0
      ? dateFilter
      : { gte: (() => { const d = new Date(); d.setDate(d.getDate() - days + 1); return d.toISOString().split("T")[0]; })() };

    const completedBookings = await db.booking.findMany({
      where: {
        status: "completed",
        date: whereDate,
      },
      select: {
        id: true,
        bookingId: true,
        totalAmount: true,
        commissionAmount: true,
        doctorEarnings: true,
        date: true,
        consultationMode: true,
        patientName: true,
        doctor: { select: { id: true, name: true, specialty: true } },
      },
      orderBy: { date: "desc" },
    });

    const doctorRevenueMap: Record<string, { name: string; specialty: string; doctorId: string; amount: number; commission: number; earnings: number; bookings: Array<{ bookingId: string; patientName: string; date: string; amount: number; commission: number; mode: string }> }> = {};
    let totalRevenue = 0;
    let totalPlatformRevenue = 0;

    for (const b of completedBookings) {
      const doctorName = b.doctor?.name ?? "Unknown";
      const doctorId = b.doctor?.id ?? '';
      const specialty = b.doctor?.specialty ?? '';

      if (!doctorRevenueMap[doctorName]) {
        doctorRevenueMap[doctorName] = { name: doctorName, specialty, doctorId, amount: 0, commission: 0, earnings: 0, bookings: [] };
      }
      const entry = doctorRevenueMap[doctorName];
      entry.amount += b.totalAmount;
      entry.commission += b.commissionAmount;
      entry.earnings += b.doctorEarnings;
      entry.bookings.push({
        bookingId: b.bookingId,
        patientName: b.patientName,
        date: b.date,
        amount: b.totalAmount,
        commission: b.commissionAmount,
        mode: b.consultationMode,
      });
      totalRevenue += b.totalAmount;
      totalPlatformRevenue += b.commissionAmount;
    }

    const doctorRevenue = Object.values(doctorRevenueMap)
      .sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      doctorRevenue,
      totalRevenue,
      totalPlatformRevenue,
    });
  } catch (error) {
    console.error("Revenue analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch revenue analytics" }, { status: 500 });
  }
}
