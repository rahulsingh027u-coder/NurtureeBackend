import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const services = await db.service.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });

    const grouped: Record<string, typeof services> = {};
    for (const service of services) {
      if (!grouped[service.category]) {
        grouped[service.category] = [];
      }
      grouped[service.category].push({
        ...service,
        includes: service.includes,
      });
    }

    return NextResponse.json({ data: grouped });
  } catch (error) {
    console.error("Patient portal services error:", error);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}