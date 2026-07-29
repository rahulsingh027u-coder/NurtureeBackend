import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/commission — per-doctor aggregated commission data
export async function GET() {
  try {
    const commissions = await db.commission.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { select: { id: true, name: true, commissionRate: true, specialty: true, avatar: true } },
        booking: { select: { id: true, totalAmount: true, bookingId: true, status: true, createdAt: true } },
      },
    });

    // Aggregate per doctor
    const doctorMap = new Map<string, {
      id: string
      doctorId: string
      doctorName: string
      specialty: string | null
      profileImage: string | null
      commissionRate: number
      bookingCount: number
      totalRevenue: number
      commissionAmount: number
      doctorEarnings: number
      paidAmount: number
      pendingAmount: number
      overdueAmount: number
      bookings: Array<{
        commissionId: string
        bookingId: string
        totalAmount: number
        commissionRate: number
        commissionAmount: number
        doctorEarnings: number
        paymentStatus: string
        paidAt: Date | null
        bookingDate: Date
      }>
    }>();

    for (const c of commissions) {
      const did = c.doctorId;
      const entry = {
        commissionId: c.id,
        bookingId: c.booking?.bookingId ?? 'N/A',
        totalAmount: c.totalAmount,
        commissionRate: c.commissionRate,
        commissionAmount: c.commissionAmount,
        doctorEarnings: c.doctorEarnings,
        paymentStatus: c.paymentStatus,
        paidAt: c.paidAt,
        bookingDate: c.createdAt,
      };

      const existing = doctorMap.get(did);
      if (existing) {
        existing.bookingCount += 1;
        existing.totalRevenue += c.totalAmount;
        existing.commissionAmount += c.commissionAmount;
        existing.doctorEarnings += c.doctorEarnings;
        if (c.paymentStatus === 'paid') existing.paidAmount += c.commissionAmount;
        if (c.paymentStatus === 'pending') existing.pendingAmount += c.commissionAmount;
        if (c.paymentStatus === 'overdue') existing.overdueAmount += c.commissionAmount;
        existing.bookings.push(entry);
      } else {
        doctorMap.set(did, {
          id: `doc-${did}`,
          doctorId: did,
          doctorName: c.doctor?.name ?? 'Unknown',
          specialty: c.doctor?.specialty ?? null,
          profileImage: c.doctor?.avatar ?? null,
          commissionRate: c.doctor?.commissionRate ?? c.commissionRate,
          bookingCount: 1,
          totalRevenue: c.totalAmount,
          commissionAmount: c.commissionAmount,
          doctorEarnings: c.doctorEarnings,
          paidAmount: c.paymentStatus === 'paid' ? c.commissionAmount : 0,
          pendingAmount: c.paymentStatus === 'pending' ? c.commissionAmount : 0,
          overdueAmount: c.paymentStatus === 'overdue' ? c.commissionAmount : 0,
          bookings: [entry],
        });
      }
    }

    const commissionsList = Array.from(doctorMap.values());

    const allSummary = await db.commission.aggregate({ _sum: { commissionAmount: true } });
    const paidSummary = await db.commission.aggregate({ _sum: { commissionAmount: true }, where: { paymentStatus: "paid" } });
    const pendingSummary = await db.commission.aggregate({ _sum: { commissionAmount: true }, where: { paymentStatus: "pending" } });
    const overdueSummary = await db.commission.aggregate({ _sum: { commissionAmount: true }, where: { paymentStatus: "overdue" } });

    return NextResponse.json({
      commissions: commissionsList,
      summary: {
        totalCommission: allSummary._sum.commissionAmount ?? 0,
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

// PATCH /api/commission — update payment status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { commissionId, paymentStatus, doctorId, markAllAs, commissionRate } = body;

    if (markAllAs && doctorId) {
      const validStatuses = ['paid', 'pending', 'overdue'];
      if (!validStatuses.includes(markAllAs)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      const updateData: Record<string, unknown> = { paymentStatus: markAllAs };
      if (markAllAs === 'paid') updateData.paidAt = new Date();

      const result = await db.commission.updateMany({
        where: { doctorId, paymentStatus: { not: markAllAs } },
        data: updateData,
      });

      const remaining = await db.commission.aggregate({
        _sum: { commissionAmount: true },
        where: { doctorId, paymentStatus: { in: ['pending', 'overdue'] } },
      });
      await db.doctor.update({
        where: { id: doctorId },
        data: { commissionDue: remaining._sum.commissionAmount ?? 0 },
      });

      return NextResponse.json({ updated: result.count });
    }

    if (commissionId) {
      const validStatuses = ['paid', 'pending', 'overdue'];
      if (!paymentStatus || !validStatuses.includes(paymentStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      const updateData: Record<string, unknown> = { paymentStatus };
      if (paymentStatus === 'paid') updateData.paidAt = new Date();

      const updated = await db.commission.update({
        where: { id: commissionId },
        data: updateData,
        include: { doctor: { select: { id: true } } },
      });

      if (updated.doctor?.id) {
        const remaining = await db.commission.aggregate({
          _sum: { commissionAmount: true },
          where: { doctorId: updated.doctor.id, paymentStatus: { in: ['pending', 'overdue'] } },
        });
        await db.doctor.update({
          where: { id: updated.doctor.id },
          data: { commissionDue: remaining._sum.commissionAmount ?? 0 },
        });
      }

      return NextResponse.json({ success: true, updated });
    }

    // Update doctor's commission rate & recalculate all existing commissions
    if (doctorId && commissionRate !== undefined) {
      const rate = Number(commissionRate);
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return NextResponse.json({ error: 'Commission rate must be between 0 and 100' }, { status: 400 });
      }

      // Fetch all commissions for this doctor with their booking totalAmount
      const existingCommissions = await db.commission.findMany({
        where: { doctorId },
        select: { id: true, totalAmount: true },
      });

      // Recalculate each commission record
      const recalculated = existingCommissions.map(c => ({
        id: c.id,
        commissionRate: rate,
        commissionAmount: Math.round(c.totalAmount * (rate / 100) * 100) / 100,
        doctorEarnings: Math.round(c.totalAmount * (1 - rate / 100) * 100) / 100,
      }));

      // Batch update each commission
      for (const r of recalculated) {
        await db.commission.update({
          where: { id: r.id },
          data: {
            commissionRate: r.commissionRate,
            commissionAmount: r.commissionAmount,
            doctorEarnings: r.doctorEarnings,
          },
        });
      }

      // Update doctor rate + recalculate commissionDue
      const remaining = await db.commission.aggregate({
        _sum: { commissionAmount: true },
        where: { doctorId, paymentStatus: { in: ['pending', 'overdue'] } },
      });
      await db.doctor.update({
        where: { id: doctorId },
        data: { commissionRate: rate, commissionDue: remaining._sum.commissionAmount ?? 0 },
      });

      return NextResponse.json({ success: true, doctorId, newRate: rate, updatedCount: recalculated.length });
    }

    return NextResponse.json({ error: 'Missing commissionId or doctorId+markAllAs or doctorId+commissionRate' }, { status: 400 });
  } catch (error) {
    console.error("Commission PATCH error:", error);
    return NextResponse.json({ error: "Failed to update commission" }, { status: 500 });
  }
}
