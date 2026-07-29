import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';

    const dateFilter: Record<string, string> = {};
    if (from) dateFilter.gte = from;
    if (to) dateFilter.lte = to;
    const where = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    const [online, offline, total] = await Promise.all([
      db.booking.count({ where: { ...where, consultationMode: "online" } }),
      db.booking.count({ where: { ...where, consultationMode: "in_home" } }),
      db.booking.count({ where }),
    ]);

    return NextResponse.json({ online, offline, total });
  } catch (error) {
    console.error("Online/offline stats error:", error);
    return NextResponse.json({ error: "Failed to fetch online/offline stats" }, { status: 500 });
  }
}
