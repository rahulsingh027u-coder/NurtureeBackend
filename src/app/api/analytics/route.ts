import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''

    const dateFilter: Record<string, string> = {}
    if (from) dateFilter.gte = from
    if (to) dateFilter.lte = to

    const where = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}

    const [totalBookings, totalRevenueResult, platformRevenueResult] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.aggregate({ _sum: { totalAmount: true }, where }),
      prisma.booking.aggregate({ _sum: { commissionAmount: true }, where }),
    ])

    const totalRevenue = totalRevenueResult._sum.totalAmount || 0
    const platformRevenue = platformRevenueResult._sum.commissionAmount || 0

    // Calculate average bookings per day (last 30 days if no filter)
    const daysWhere = Object.keys(dateFilter).length > 0
      ? where
      : { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] } }

    const recentCount = await prisma.booking.count({ where: daysWhere })
    const daysSpan = from && to
      ? Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1)
      : 30
    const avgBookingsPerDay = Math.round((recentCount / daysSpan) * 10) / 10

    return NextResponse.json({
      summary: {
        totalBookings,
        totalRevenue,
        platformRevenue,
        avgBookingsPerDay,
      },
    })
  } catch (error) {
    console.error('[/api/analytics] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
