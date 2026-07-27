import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const commissions = await db.commission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { select: { name: true } },
        booking: { select: { totalAmount: true, bookingId: true } },
      },
    });

    const data = commissions.map((c) => ({
      id: c.id,
      bookingId: c.booking?.bookingId ?? 'N/A',
      doctorName: c.doctor?.name ?? 'Unknown',
      totalAmount: c.booking?.totalAmount ?? 0,
      commissionRate: c.commissionRate,
      commissionAmount: c.commissionAmount,
      doctorEarnings: c.doctorEarnings,
      paymentStatus: c.paymentStatus,
      paidAt: c.paidAt,
      createdAt: c.createdAt,
    }));

    const summary = await db.commission.aggregate({
      _sum: { commissionAmount: true },
      where: {},
    });

    const paidSummary = await db.commission.aggregate({
      _sum: { commissionAmount: true },
      where: { paymentStatus: "paid" },
    });

    const pendingSummary = await db.commission.aggregate({
      _sum: { commissionAmount: true },
      where: { paymentStatus: "pending" },
    });

    const overdueSummary = await db.commission.aggregate({
      _sum: { commissionAmount: true },
      where: { paymentStatus: "overdue" },
    });

    return NextResponse.json({
      data,
      summary: {
        totalCommission: summary._sum.commissionAmount ?? 0,
        paidCommission: paidSummary._sum.commissionAmount ?? 0,
        pendingCommission: pendingSummary._sum.commissionAmount ?? 0,
        overdueCommission: overdueSummary._sum.commissionAmount ?? 0,
      },
    });
  } catch (error) {
    console.error("Commission GET error:", error);
    return NextResponse.json({ error: "Failed to fetch commissions" }, { status: 500 });
  }
}