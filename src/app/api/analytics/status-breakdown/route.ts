import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const groupBy = searchParams.get('groupBy') || 'status'; // status | mode | type

    const dateFilter: Record<string, string> = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;
    const where = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    const bookings = await db.booking.findMany({
      where,
      select: { status: true, consultationMode: true, bookingType: true, totalAmount: true, date: true },
    });

    if (groupBy === 'mode') {
      const map: Record<string, { count: number; revenue: number }> = {};
      for (const b of bookings) {
        const key = b.consultationMode === 'online' ? 'Online' : 'At Home';
        if (!map[key]) map[key] = { count: 0, revenue: 0 };
        map[key].count++;
        map[key].revenue += b.totalAmount;
      }
      return NextResponse.json({ groupBy: 'mode', data: map });
    }

    if (groupBy === 'type') {
      const map: Record<string, { count: number; revenue: number }> = {};
      const labels: Record<string, string> = { doctor_consultation: 'Doctor Consultation', child_care: 'Child Care', elder_care: 'Elder Care', verification: 'Verification' };
      for (const b of bookings) {
        const key = labels[b.bookingType] || b.bookingType;
        if (!map[key]) map[key] = { count: 0, revenue: 0 };
        map[key].count++;
        map[key].revenue += b.totalAmount;
      }
      return NextResponse.json({ groupBy: 'type', data: map });
    }

    // Default: group by status
    const map: Record<string, { count: number; revenue: number }> = {};
    for (const b of bookings) {
      const key = b.status.charAt(0).toUpperCase() + b.status.slice(1).replace('_', ' ');
      if (!map[key]) map[key] = { count: 0, revenue: 0 };
      map[key].count++;
      map[key].revenue += b.totalAmount;
    }
    return NextResponse.json({ groupBy: 'status', data: map });
  } catch (error) {
    console.error("Status breakdown error:", error);
    return NextResponse.json({ error: "Failed to fetch status breakdown" }, { status: 500 });
  }
}
