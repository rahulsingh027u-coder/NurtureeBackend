import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [
      totalBookingsToday,
      onlineBookingsToday,
      offlineBookingsToday,
      childCareBookings,
      elderCareBookings,
      activeDoctors,
      totalDoctors,
      offlineDoctors,
      blockedDoctors,
      portalUserDoctors,
      totalPatients,
      pendingVerifications,
      commissionDue,
      todayRevenue,
      totalRevenueResult,
      platformRevenueResult,
      recentBookings,
      doctorStatusList,
    ] = await Promise.all([
      db.booking.count({ where: { date: today } }),
      db.booking.count({
        where: { date: today, consultationMode: "online" },
      }),
      db.booking.count({
        where: { date: today, consultationMode: "in_home" },
      }),
      db.booking.count({ where: { bookingType: "child_care" } }),
      db.booking.count({ where: { bookingType: "elder_care" } }),
      db.doctor.count({ where: { isOnline: true } }),
      db.doctor.count(),
      db.doctor.count({ where: { isOnline: false } }),
      db.doctor.count({ where: { isBlocked: true } }),
      db.doctor.count({ where: { isPortalUser: true } }),
      db.patient.count(),
      db.verification.count({ where: { status: "pending" } }),
      db.commission.aggregate({
        _sum: { commissionAmount: true },
        where: { paymentStatus: "pending" },
      }),
      db.booking.aggregate({
        _sum: { totalAmount: true },
        where: { date: today, status: "completed" },
      }),
      db.booking.aggregate({
        _sum: { totalAmount: true },
        where: { status: "completed" },
      }),
      db.commission.aggregate({
        _sum: { commissionAmount: true },
        where: { paymentStatus: "paid" },
      }),
      db.booking.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          patient: { select: { name: true, uhid: true } },
          doctor: { select: { name: true } },
        },
      }),
      db.doctor.findMany({
        select: {
          id: true,
          name: true,
          specialty: true,
          isOnline: true,
          isBlocked: true,
          isPortalUser: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalBookingsToday,
      onlineBookingsToday,
      offlineBookingsToday,
      childCareBookings,
      elderCareBookings,
      activeDoctors,
      totalDoctors,
      onlineDoctors: activeDoctors,
      offlineDoctors,
      blockedDoctors,
      portalUserDoctors,
      totalPatients,
      pendingVerifications,
      commissionDue: commissionDue._sum.commissionAmount ?? 0,
      todayRevenue: todayRevenue._sum.totalAmount ?? 0,
      totalRevenue: totalRevenueResult._sum.totalAmount ?? 0,
      platformRevenue: platformRevenueResult._sum.commissionAmount ?? 0,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        bookingId: b.bookingId,
        patientName: b.patient?.name ?? 'Unknown',
        patientUhid: b.patient?.uhid ?? null,
        doctorName: b.doctor?.name ?? "N/A",
        date: b.date,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status,
        type: b.bookingType,
        mode: b.consultationMode,
      })),
      doctorStatusList,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}