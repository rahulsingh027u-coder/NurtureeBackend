'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { CalendarDays, IndianRupee, BarChart3, TrendingUp, RefreshCw, Users } from 'lucide-react'

interface DayBooking {
  date: string
  count: number
}

interface OnlineOffline {
  online: number
  offline: number
  total: number
}

interface DoctorRevenue {
  doctorName: string
  amount: number
}

interface AnalyticsSummary {
  totalBookings: number
  totalRevenue: number
  platformRevenue: number
  avgBookingsPerDay: number
}

export function AnalyticsSection() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [bookingsPerDay, setBookingsPerDay] = useState<DayBooking[]>([])
  const [onlineOffline, setOnlineOffline] = useState<OnlineOffline | null>(null)
  const [doctorRevenue, setDoctorRevenue] = useState<DoctorRevenue[]>([])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      const qs = params.toString() ? `?${params.toString()}` : ''

      const [summaryRes, bpdRes, ooRes, revRes] = await Promise.all([
        fetch(`/api/analytics${qs}`),
        fetch('/api/analytics/bookings-per-day?days=30'),
        fetch('/api/analytics/online-offline'),
        fetch('/api/analytics/revenue?days=30'),
      ])

      if (summaryRes.ok) {
        const data = await summaryRes.json()
        setSummary(data.summary || data)
      }
      if (bpdRes.ok) {
        const data = await bpdRes.json()
        setBookingsPerDay(Array.isArray(data) ? data : data.bookings || [])
      }
      if (ooRes.ok) {
        setOnlineOffline(await ooRes.json())
      }
      if (revRes.ok) {
        const data = await revRes.json()
        const rev = Array.isArray(data.doctorRevenue) ? data.doctorRevenue : []
        setDoctorRevenue(rev.sort((a: DoctorRevenue, b: DoctorRevenue) => b.amount - a.amount).slice(0, 5))
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch analytics', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, toast])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString('en-IN')}`

  const maxBookingCount = Math.max(...bookingsPerDay.map((d) => d.count), 1)

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Date Range Filter */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">Date Range</p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">From</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
              <span className="text-gray-400 hidden sm:block">—</span>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">To</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-auto"
                />
              </div>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                onClick={fetchAnalytics}
                disabled={loading}
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold text-gray-900">{summary?.totalBookings ?? 0}</p>}
              <p className="text-xs text-gray-500">Total Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.totalRevenue ?? 0)}</p>}
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.platformRevenue ?? 0)}</p>}
              <p className="text-xs text-gray-500">Platform Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold text-gray-900">{(summary?.avgBookingsPerDay ?? 0).toFixed(1)}</p>}
              <p className="text-xs text-gray-500">Avg Bookings / Day</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Per Day Chart */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Bookings Per Day (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-end gap-1 h-48">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${Math.random() * 100}%` }} />
              ))}
            </div>
          ) : bookingsPerDay.length > 0 ? (
            <div className="flex items-end gap-1 h-48 w-full overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
              {bookingsPerDay.map((day, i) => {
                const heightPct = (day.count / maxBookingCount) * 100
                return (
                  <div key={i} className="flex flex-col items-center flex-shrink-0 group" style={{ minWidth: '20px', flex: '1' }}>
                    <div className="text-[10px] text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity mb-1 font-medium">
                      {day.count}
                    </div>
                    <div
                      className="w-full max-w-[28px] bg-blue-500 hover:bg-blue-600 rounded-t-sm transition-colors cursor-default min-h-[4px]"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                      title={`${day.date}: ${day.count} bookings`}
                    />
                    <div className="text-[9px] text-gray-400 mt-1 truncate max-w-[40px]">
                      {day.date.slice(8)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-8">No booking data available</p>
          )}
        </CardContent>
      </Card>

      {/* Online vs Offline + Revenue by Doctor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Online vs Offline */}
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Online vs Offline Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-12 w-full rounded-lg" />
            ) : onlineOffline ? (
              <div className="space-y-4">
                <div className="relative h-10 w-full rounded-lg overflow-hidden flex">
                  {onlineOffline.total > 0 ? (
                    <>
                      <div
                        className="bg-blue-500 flex items-center justify-center transition-all"
                        style={{ width: `${(onlineOffline.online / onlineOffline.total) * 100}%` }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {onlineOffline.total > 0
                            ? `${((onlineOffline.online / onlineOffline.total) * 100).toFixed(0)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div
                        className="bg-gray-300 flex items-center justify-center transition-all"
                        style={{ width: `${(onlineOffline.offline / onlineOffline.total) * 100}%` }}
                      >
                        <span className="text-xs font-semibold text-gray-700">
                          {onlineOffline.total > 0
                            ? `${((onlineOffline.offline / onlineOffline.total) * 100).toFixed(0)}%`
                            : '0%'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-400">No data</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-sm text-gray-600">Online</span>
                    <span className="text-sm font-semibold text-gray-900">{onlineOffline.online}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-gray-300" />
                    <span className="text-sm text-gray-600">Offline</span>
                    <span className="text-sm font-semibold text-gray-900">{onlineOffline.offline}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-6">No online/offline data</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Doctor */}
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Top Revenue by Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full rounded" />
                ))}
              </div>
            ) : doctorRevenue.length > 0 ? (
              <div className="space-y-3">
                {doctorRevenue.map((doc, i) => {
                  const maxRev = doctorRevenue[0]?.amount || 1
                  const widthPct = (doc.amount / maxRev) * 100
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900 truncate mr-2">{doc.doctorName}</span>
                        <span className="text-sm font-mono text-blue-700 font-medium flex-shrink-0">{formatCurrency(doc.amount)}</span>
                      </div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-6">No revenue data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
