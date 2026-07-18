import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [online, offline, total] = await Promise.all([
      db.booking.count({ where: { consultationMode: "online" } }),
      db.booking.count({ where: { consultationMode: "in_home" } }),
      db.booking.count(),
    ]);

    return NextResponse.json({ online, offline, total });
  } catch (error) {
    console.error("Online/offline stats error:", error);
    return NextResponse.json({ error: "Failed to fetch online/offline stats" }, { status: 500 });
  }
}