'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  CalendarDays, IndianRupee, BarChart3, TrendingUp, RefreshCw, Users,
  ChevronRight, Monitor, Home, Stethoscope, Baby, Heart, ShieldCheck,
  ArrowRight, CheckCircle2, Clock, XCircle, AlertCircle,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DayBooking { date: string; count: number }

interface OnlineOffline { online: number; offline: number; total: number }

interface DoctorRevenueEntry {
  name: string
  specialty: string
  doctorId: string
  amount: number
  commission: number
  earnings: number
  bookings: Array<{
    bookingId: string
    patientName: string
    date: string
    amount: number
    commission: number
    mode: string
  }>
}

interface AnalyticsSummary {
  totalBookings: number
  totalRevenue: number
  platformRevenue: number
  avgBookingsPerDay: number
}

interface StatusGroup {
  [key: string]: { count: number; revenue: number }
}

interface StatusBreakdown {
  groupBy: string
  data: StatusGroup
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PRESET_RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: 0 },
] as const

const statusIcons: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  confirmed: <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />,
  pending: <Clock className="w-3.5 h-3.5 text-amber-500" />,
  'in progress': <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />,
  cancelled: <XCircle className="w-3.5 h-3.5 text-red-500" />,
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = (v: number) => `₹${v.toLocaleString('en-IN')}`
const fmtDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}
const today = () => new Date().toISOString().split('T')[0]
const daysAgo = (n: number) => {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AnalyticsSection() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [activePreset, setActivePreset] = useState(1) // 30D default
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [bookingsPerDay, setBookingsPerDay] = useState<DayBooking[]>([])
  const [onlineOffline, setOnlineOffline] = useState<OnlineOffline | null>(null)
  const [doctorRevenue, setDoctorRevenue] = useState<DoctorRevenueEntry[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown | null>(null)

  // Drill-down sheets
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorRevenueEntry | null>(null)
  const [selectedDay, setSelectedDay] = useState<DayBooking | null>(null)

  const applyPreset = (idx: number) => {
    setActivePreset(idx)
    const days = PRESET_RANGES[idx].days
    if (days === 0) {
      setDateFrom(''); setDateTo('')
    } else {
      setDateFrom(daysAgo(days - 1)); setDateTo(today())
    }
  }

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
      const qs = params.toString() ? `?${params.toString()}` : ''

      const [summaryRes, bpdRes, ooRes, revRes, sbRes] = await Promise.all([
        fetch(`/api/analytics${qs}`),
        fetch(`/api/analytics/bookings-per-day${qs || '?days=30'}`),
        fetch(`/api/analytics/online-offline${qs}`),
        fetch(`/api/analytics/revenue${qs || '?days=30'}`),
        fetch(`/api/analytics/status-breakdown${qs}`),
      ])

      if (summaryRes.ok) { const d = await summaryRes.json(); setSummary(d.summary || d) }
      if (bpdRes.ok) { const d = await bpdRes.json(); setBookingsPerDay(Array.isArray(d) ? d : d.data || []) }
      if (ooRes.ok) { setOnlineOffline(await ooRes.json()) }
      if (revRes.ok) { const d = await revRes.json(); setDoctorRevenue(Array.isArray(d.doctorRevenue) ? d.doctorRevenue : []) }
      if (sbRes.ok) { setStatusBreakdown(await sbRes.json()) }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch analytics', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo, toast])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  // Set initial 30D range
  useEffect(() => { applyPreset(1) }, []) // eslint-disable-line

  const maxBpd = Math.max(...bookingsPerDay.map(d => d.count), 1)

  /* ================================================================ */
  //  RENDER
  /* ================================================================ */

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* -------- Date Range Filter -------- */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">Date Range</p>
            </div>
            {/* Preset pills */}
            <div className="flex items-center gap-1.5">
              {PRESET_RANGES.map((p, i) => (
                <button
                  key={i}
                  onClick={() => applyPreset(i)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
                    activePreset === i && !dateFrom
                      ? 'bg-blue-600 text-white'
                      : activePreset === i
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >{p.label}</button>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">From</Label>
                <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(-1) }} className="w-full sm:w-auto" />
              </div>
              <span className="text-gray-400 hidden sm:block mt-5">—</span>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">To</Label>
                <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(-1) }} className="w-full sm:w-auto" />
              </div>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 mt-5" onClick={fetchAnalytics} disabled={loading}>
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
                Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* -------- Summary Cards -------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<BarChart3 className="w-5 h-5" />} bg="bg-blue-50" iconBg="bg-blue-100 text-blue-600" value={loading ? null : String(summary?.totalBookings ?? 0)} label="Total Bookings" />
        <StatCard icon={<IndianRupee className="w-5 h-5" />} bg="bg-indigo-50" iconBg="bg-indigo-100 text-indigo-600" value={loading ? null : fmt(summary?.totalRevenue ?? 0)} label="Total Revenue" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} bg="bg-emerald-50" iconBg="bg-emerald-100 text-emerald-600" value={loading ? null : fmt(summary?.platformRevenue ?? 0)} label="Platform Revenue" />
        <StatCard icon={<Users className="w-5 h-5" />} bg="bg-cyan-50" iconBg="bg-cyan-100 text-cyan-600" value={loading ? null : (summary?.avgBookingsPerDay ?? 0).toFixed(1)} label="Avg Bookings / Day" />
      </div>

      {/* -------- Booking Status Breakdown (Clickable bars) -------- */}
      {statusBreakdown && (
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Booking Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusBreakdown.data)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([status, info]) => {
                  const maxCount = Math.max(...Object.values(statusBreakdown.data).map(v => v.count), 1)
                  const pct = Math.round((info.count / maxCount) * 100)
                  const icon = statusIcons[status.toLowerCase()] || <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
                  const statusColor: Record<string, string> = {
                    'Completed': 'bg-emerald-500', 'Confirmed': 'bg-blue-500',
                    'Pending': 'bg-amber-500', 'In progress': 'bg-indigo-500', 'Cancelled': 'bg-red-400',
                  }
                  const barColor = statusColor[status] || 'bg-gray-400'
                  return (
                    <button
                      key={status}
                      className="w-full text-left group cursor-pointer"
                      title={`${status}: ${info.count} bookings, ${fmt(info.revenue)} revenue`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {icon}
                          <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{status}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 font-mono">{fmt(info.revenue)}</span>
                          <span className="text-sm font-semibold text-gray-900 min-w-[24px] text-right">{info.count}</span>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full transition-all group-hover:opacity-80', barColor)} style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* -------- Bookings Per Day (Clickable bars) -------- */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Bookings Per Day</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-end gap-1 h-48">{Array.from({ length: 15 }).map((_, i) => <Skeleton key={i} className="flex-1 rounded-t-md" style={{ height: `${30 + Math.random() * 70}%` }} />)}</div>
          ) : bookingsPerDay.length > 0 ? (
            <div className="flex items-end gap-[3px] h-48 w-full overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
              {bookingsPerDay.map((day, i) => {
                const hPct = (day.count / maxBpd) * 100
                const hasBookings = day.count > 0
                return (
                  <button
                    key={i}
                    className="flex flex-col items-center flex-shrink-0 group cursor-pointer"
                    style={{ minWidth: '12px', flex: '1' }}
                    onClick={() => hasBookings && setSelectedDay(day)}
                    title={hasBookings ? `${fmtDate(day.date)}: ${day.count} bookings — click for details` : `${fmtDate(day.date)}: No bookings`}
                  >
                    <div className={cn(
                      'text-[10px] font-medium mb-0.5 transition-opacity',
                      hasBookings ? 'text-blue-600 opacity-0 group-hover:opacity-100' : 'text-transparent'
                    )}>{day.count}</div>
                    <div
                      className={cn(
                        'w-full max-w-[28px] rounded-t-sm transition-all min-h-[3px]',
                        hasBookings
                          ? 'bg-blue-500 hover:bg-blue-600 group-hover:shadow-md group-hover:shadow-blue-200'
                          : 'bg-gray-100'
                      )}
                      style={{ height: `${Math.max(hPct, hasBookings ? 4 : 2)}%` }}
                    />
                    <div className="text-[9px] text-gray-400 mt-1 truncate max-w-[36px] group-hover:text-gray-600 transition-colors">
                      {day.date.slice(8)}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-8">No booking data available</p>
          )}
        </CardContent>
      </Card>

      {/* -------- Online vs Offline + Revenue by Doctor -------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Online vs Offline */}
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Online vs At Home</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32 w-full rounded-lg" />
            ) : onlineOffline && onlineOffline.total > 0 ? (
              <div className="space-y-4">
                {/* Stacked bar */}
                <div className="relative h-14 w-full rounded-xl overflow-hidden flex shadow-sm">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-400 flex items-center justify-center transition-all cursor-pointer hover:from-blue-600 hover:to-blue-500"
                    style={{ width: `${(onlineOffline.online / onlineOffline.total) * 100}%` }}
                    title={`${onlineOffline.online} online bookings`}
                  >
                    <div className="text-center">
                      <Monitor className="w-4 h-4 text-white/80 mx-auto mb-0.5" />
                      <span className="text-xs font-bold text-white">{onlineOffline.online}</span>
                    </div>
                  </div>
                  <div
                    className="bg-gradient-to-r from-gray-400 to-gray-300 flex items-center justify-center transition-all cursor-pointer hover:from-gray-500 hover:to-gray-400"
                    style={{ width: `${(onlineOffline.offline / onlineOffline.total) * 100}%` }}
                    title={`${onlineOffline.offline} at-home bookings`}
                  >
                    <div className="text-center">
                      <Home className="w-4 h-4 text-gray-700/80 mx-auto mb-0.5" />
                      <span className="text-xs font-bold text-gray-700">{onlineOffline.offline}</span>
                    </div>
                  </div>
                </div>
                {/* Legend */}
                <div className="flex items-center justify-center gap-8">
                  <div className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-3 h-3 rounded-sm bg-blue-500" />
                    <span className="text-sm text-gray-600">Online</span>
                    <span className="text-sm font-bold text-gray-900">{onlineOffline.online}</span>
                    <span className="text-xs text-gray-400">({((onlineOffline.online / onlineOffline.total) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer group">
                    <div className="w-3 h-3 rounded-sm bg-gray-400" />
                    <span className="text-sm text-gray-600">At Home</span>
                    <span className="text-sm font-bold text-gray-900">{onlineOffline.offline}</span>
                    <span className="text-xs text-gray-400">({((onlineOffline.offline / onlineOffline.total) * 100).toFixed(0)}%)</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-6">No booking data</p>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Doctor (Clickable bars) */}
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-900">Revenue by Doctor</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded" />)}</div>
            ) : doctorRevenue.length > 0 ? (
              <div className="space-y-3">
                {doctorRevenue.map((doc, i) => {
                  const maxRev = doctorRevenue[0]?.amount || 1
                  const pct = (doc.amount / maxRev) * 100
                  return (
                    <button
                      key={i}
                      className="w-full text-left group cursor-pointer"
                      onClick={() => setSelectedDoctor(doc)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors truncate">{doc.name}</span>
                          {doc.specialty && <span className="text-[10px] text-gray-400 truncate hidden sm:inline">· {doc.specialty}</span>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 font-mono">{doc.bookings.length} bookings</span>
                          <span className="text-sm font-mono text-blue-700 font-semibold">{fmt(doc.amount)}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all group-hover:from-blue-600 group-hover:to-blue-500" style={{ width: `${pct}%` }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-gray-400 text-sm py-6">No revenue data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* -------- Doctor Revenue Detail Sheet -------- */}
      <Sheet open={!!selectedDoctor} onOpenChange={open => !open && setSelectedDoctor(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selectedDoctor && <DoctorRevenueSheet doctor={selectedDoctor} />}
        </SheetContent>
      </Sheet>

      {/* -------- Day Detail Sheet -------- */}
      <Sheet open={!!selectedDay} onOpenChange={open => !open && setSelectedDay(null)}>
        <SheetContent className="w-full sm:max-w-sm overflow-y-auto">
          {selectedDay && <DayDetailSheet day={selectedDay} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

function StatCard({ icon, bg, iconBg, value, label }: {
  icon: React.ReactNode; bg: string; iconBg: string; value: string | null; label: string
}) {
  return (
    <Card className={cn('rounded-xl shadow-sm border-0', bg)}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', iconBg)}>{icon}</div>
        <div className="min-w-0">
          {value === null ? <Skeleton className="h-7 w-16" /> : <p className="text-xl font-bold text-gray-900 truncate">{value}</p>}
          <p className="text-[11px] text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DoctorRevenueSheet({ doctor }: { doctor: DoctorRevenueEntry }) {
  return (
    <div className="space-y-5 pt-2">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
            {getInitials(doctor.name)}
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{doctor.name}</p>
            {doctor.specialty && <p className="text-sm text-gray-500">{doctor.specialty}</p>}
          </div>
        </SheetTitle>
      </SheetHeader>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Revenue" value={fmt(doctor.amount)} />
        <MiniStat label="Commission" value={fmt(doctor.commission)} />
        <MiniStat label="Earnings" value={fmt(doctor.earnings)} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">
          Booking Breakdown ({doctor.bookings.length})
        </p>
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="text-[11px]">Booking</TableHead>
                <TableHead className="text-[11px]">Patient</TableHead>
                <TableHead className="text-[11px] text-right">Amount</TableHead>
                <TableHead className="text-[11px]">Mode</TableHead>
                <TableHead className="text-[11px]">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctor.bookings.map((b, i) => (
                <TableRow key={i} className="hover:bg-gray-50/50">
                  <TableCell className="text-xs font-mono text-gray-700">{b.bookingId}</TableCell>
                  <TableCell className="text-xs text-gray-700">{b.patientName}</TableCell>
                  <TableCell className="text-xs text-blue-700 text-right font-mono font-medium">{fmt(b.amount)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      'text-[10px]',
                      b.mode === 'online' ? 'border-blue-200 text-blue-600' : 'border-gray-200 text-gray-600'
                    )}>
                      {b.mode === 'online' ? <Monitor className="w-3 h-3 mr-1" /> : <Home className="w-3 h-3 mr-1" />}
                      {b.mode === 'online' ? 'Online' : 'Home'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">{fmtDate(b.date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

function DayDetailSheet({ day }: { day: DayBooking }) {
  const [dayBookings, setDayBookings] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/bookings?date=${day.date}`)
      .then(r => r.json())
      .then(d => setDayBookings(Array.isArray(d) ? d : d.bookings || d.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [day.date])

  return (
    <div className="space-y-5 pt-2">
      <SheetHeader>
        <SheetTitle>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-900">{fmtDate(day.date)}</p>
              <p className="text-sm text-gray-500">{day.count} booking{day.count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </SheetTitle>
      </SheetHeader>

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
      ) : dayBookings.length > 0 ? (
        <div className="space-y-2">
          {dayBookings.map((b: Record<string, unknown>, i: number) => (
            <div key={i} className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn(
                    'text-[10px]',
                    b.status === 'completed' ? 'border-emerald-200 text-emerald-600' :
                    b.status === 'confirmed' ? 'border-blue-200 text-blue-600' :
                    b.status === 'pending' ? 'border-amber-200 text-amber-600' :
                    'border-gray-200 text-gray-600'
                  )}>
                    {String(b.status || '').charAt(0).toUpperCase()}{String(b.status || '').slice(1)}
                  </Badge>
                  <span className="text-xs text-gray-400 font-mono">{String(b.bookingId || '')}</span>
                </div>
                <span className="text-sm font-mono font-semibold text-gray-900">{fmt(Number(b.totalAmount || 0))}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{String(b.patientName || '')}</span>
                <span>·</span>
                <span>{String(b.consultationMode) === 'online' ? 'Online' : 'At Home'}</span>
                <span>·</span>
                <span>{String(b.bookingType || '').replace('_', ' ')}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-400 text-sm py-6">No bookings found</p>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3 text-center">
      <p className="text-[11px] text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900 font-mono mt-0.5">{value}</p>
    </div>
  )
}
