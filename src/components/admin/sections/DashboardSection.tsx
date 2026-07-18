'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Stethoscope, Wifi, CalendarDays, Users, IndianRupee, ShieldCheck,
  Baby, HeartPulse, ArrowRight, TrendingUp
} from 'lucide-react'

interface DashboardStats {
  totalDoctors: number
  onlineDoctors: number
  todayBookings: number
  totalPatients: number
  platformRevenue: number
  pendingVerifications: number
  childCareActive: number
  elderCareActive: number
  doctorsOnline: number
  doctorsTotal: number
  recentBookings: Array<{
    id: string
    bookingId: string
    patientName: string
    patientUhid?: string
    doctorName?: string
    consultationMode: string
    status: string
    date: string
    startTime: string
    totalAmount: number
  }>
  bookingsPerDay: Array<{ date: string; count: number }>
}

const statCards = [
  { key: 'totalDoctors', label: 'Total Doctors', icon: Stethoscope, iconBg: 'bg-blue-500', iconColor: 'text-white' },
  { key: 'onlineDoctors', label: 'Online Doctors', icon: Wifi, iconBg: 'bg-green-500', iconColor: 'text-white' },
  { key: 'todayBookings', label: "Today's Bookings", icon: CalendarDays, iconBg: 'bg-amber-500', iconColor: 'text-white' },
  { key: 'totalPatients', label: 'Total Patients', icon: Users, iconBg: 'bg-purple-500', iconColor: 'text-white' },
  { key: 'platformRevenue', label: 'Platform Revenue', icon: IndianRupee, iconBg: 'bg-teal-500', iconColor: 'text-white', format: 'currency' },
  { key: 'pendingVerifications', label: 'Pending Verifications', icon: ShieldCheck, iconBg: 'bg-yellow-400', iconColor: 'text-white' },
] as const

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const modeColor: Record<string, string> = {
  online: 'bg-blue-100 text-blue-700',
  in_home: 'bg-amber-100 text-amber-700',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

function formatCurrency(val: number) {
  if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
  if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K`
  return `₹${val}`
}

export function DashboardSection() {
  const { user, setActiveSection } = useAppStore()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchStats() }, [])

  const fetchStats = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/analytics/bookings-per-day?days=30'),
      ])
      let statsData: any = {}
      let analyticsData: any[] = []

      if (statsRes.ok) statsData = await statsRes.json()
      if (analyticsRes.ok) {
        const a = await analyticsRes.json()
        analyticsData = Array.isArray(a) ? a : a.data || []
      }

      setStats({
        totalDoctors: statsData.totalDoctors || 0,
        onlineDoctors: statsData.onlineDoctors || 0,
        todayBookings: statsData.totalBookingsToday || 0,
        totalPatients: statsData.totalPatients || 0,
        platformRevenue: statsData.platformRevenue || 0,
        pendingVerifications: statsData.pendingVerifications || 0,
        childCareActive: statsData.childCareBookings || 0,
        elderCareActive: statsData.elderCareBookings || 0,
        doctorsOnline: statsData.onlineDoctors || 0,
        doctorsTotal: statsData.totalDoctors || 0,
        recentBookings: statsData.recentBookings || [],
        bookingsPerDay: analyticsData,
      })
    } catch {
      setStats({
        totalDoctors: 0, onlineDoctors: 0, todayBookings: 0, totalPatients: 0,
        platformRevenue: 0, pendingVerifications: 0, childCareActive: 0,
        elderCareActive: 0, doctorsOnline: 0, doctorsTotal: 0,
        recentBookings: [], bookingsPerDay: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const maxBookingCount = useMemo(() => {
    if (!stats?.bookingsPerDay?.length) return 1
    return Math.max(...stats.bookingsPerDay.map(d => d.count), 1)
  }, [stats?.bookingsPerDay])

  const getStatValue = (key: string) => {
    if (!stats) return 0
    return (stats as any)[key] ?? 0
  }

  const formatValue = (key: string, val: number) => {
    if (key === 'platformRevenue') return formatCurrency(val)
    return val
  }

  return (
    <div className="p-6 bg-[#F9FAFB] min-h-full">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">{getGreeting()}, {user?.name?.split(' ')[0] || 'Admin'}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{getFormattedDate()}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.key} className="rounded-lg shadow-sm border border-gray-100 bg-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', card.iconBg)}>
                    <Icon className={cn('w-5 h-5', card.iconColor)} />
                  </div>
                </div>
                {loading ? (
                  <Skeleton className="h-7 w-16 mb-1" />
                ) : (
                  <p className="text-[28px] font-bold text-gray-900 leading-none">{formatValue(card.key, getStatValue(card.key))}</p>
                )}
                <p className="text-sm text-gray-500 mt-1.5">{card.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-lg shadow-sm border-0 bg-blue-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSection('child_care')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center">
                <Baby className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Child Care Services</p>
                <p className="text-xs text-gray-500 mt-0.5">{loading ? <Skeleton className="h-3 w-24 inline-block" /> : `${stats?.childCareActive || 0} active assignments`}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm border-0 bg-purple-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSection('elder_care')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Elder Care Services</p>
                <p className="text-xs text-gray-500 mt-0.5">{loading ? <Skeleton className="h-3 w-24 inline-block" /> : `${stats?.elderCareActive || 0} active assignments`}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-sm border-0 bg-green-50 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveSection('doctors')}>
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center">
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Doctor Portal Activity</p>
                <p className="text-xs text-gray-500 mt-0.5">{loading ? <Skeleton className="h-3 w-32 inline-block" /> : `${stats?.doctorsOnline || 0} / ${stats?.doctorsTotal || 0} doctors online`}</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Table + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent Bookings */}
        <Card className="lg:col-span-3 rounded-lg shadow-sm border border-gray-100 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Recent Bookings</h3>
              <Button variant="ghost" className="text-blue-600 text-xs font-medium gap-1 p-0 h-auto hover:bg-transparent" onClick={() => setActiveSection('bookings')}>
                View All <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
            <div className="max-h-[280px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-100 hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase text-gray-400 h-9">Booking ID</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-gray-400 h-9">Patient</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-gray-400 h-9">UHID</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-gray-400 h-9">Doctor</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-gray-400 h-9">Mode</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-gray-400 h-9">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-gray-400 h-9">Date</TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase text-gray-400 h-9">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j} className="py-2"><Skeleton className="h-4 w-16" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : stats?.recentBookings && stats.recentBookings.length > 0 ? (
                    stats.recentBookings.map((b) => (
                      <TableRow key={b.id} className="hover:bg-gray-50/50 border-b border-gray-50">
                        <TableCell className="font-mono text-xs text-gray-600 py-2.5">{b.bookingId}</TableCell>
                        <TableCell className="text-xs text-gray-900 font-medium py-2.5">{b.patientName}</TableCell>
                        <TableCell className="font-mono text-xs text-blue-600 py-2.5">{b.patientUhid || '—'}</TableCell>
                        <TableCell className="text-xs text-gray-600 py-2.5">{b.doctorName || '—'}</TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-5', modeColor[b.consultationMode])}>
                            {b.consultationMode === 'online' ? 'Online' : 'Home'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0 h-5 capitalize', statusColor[b.status])}>
                            {b.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500 py-2.5">{b.date}</TableCell>
                        <TableCell className="text-xs text-gray-900 font-medium py-2.5">₹{b.totalAmount || 0}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-10 text-gray-400 text-xs">No recent bookings</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Trend Chart */}
        <Card className="lg:col-span-2 rounded-lg shadow-sm border border-gray-100 bg-white">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Bookings Trend</h3>
              <span className="text-[11px] text-gray-400">Last 30 Days</span>
            </div>
            {loading ? (
              <div className="h-[220px] flex items-end gap-1">
                {Array.from({ length: 30 }).map((_, i) => (
                  <Skeleton key={i} className="flex-1 bg-gray-100" style={{ height: `${Math.random() * 80 + 20}%` }} />
                ))}
              </div>
            ) : stats?.bookingsPerDay && stats.bookingsPerDay.length > 0 ? (
              <div className="h-[220px] flex items-end gap-[3px]">
                {stats.bookingsPerDay.map((d, i) => {
                  const height = Math.max((d.count / maxBookingCount) * 100, 3)
                  const isLast5 = i >= stats.bookingsPerDay.length - 5
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full relative group">
                        <div
                          className={cn(
                            'w-full rounded-t-sm transition-all',
                            isLast5 ? 'bg-blue-500' : 'bg-blue-100'
                          )}
                          style={{ height: `${height}%`, minHeight: '4px' }}
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {d.count}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-xs text-gray-400">No booking data available</p>
              </div>
            )}

            {/* X-axis labels */}
            {!loading && stats?.bookingsPerDay && stats.bookingsPerDay.length > 0 && (
              <div className="flex justify-between mt-1.5">
                {stats.bookingsPerDay.filter((_, i) => i % 7 === 0).map(d => (
                  <span key={d.date} className="text-[9px] text-gray-400">{d.date.slice(5)}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}