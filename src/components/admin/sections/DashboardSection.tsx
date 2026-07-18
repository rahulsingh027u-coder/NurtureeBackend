'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  CalendarDays, Monitor, Home, Baby, Users, Stethoscope,
  UserPlus, CalendarPlus, UserCheck, BarChart3, Plus,
} from 'lucide-react'

interface DashboardStats {
  totalToday: number
  onlineBookings: number
  offlineBookings: number
  childCareBookings: number
  elderCareBookings: number
  activeDoctors: number
  recentBookings: Array<{
    id: string
    bookingId: string
    patientName: string
    patientUhid?: string
    doctorName?: string
    bookingType: string
    consultationMode: string
    status: string
    date: string
    startTime: string
  }>
  doctorStatuses: {
    online: number
    offline: number
    blocked: number
    usingPortal: number
  }
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const typeColor: Record<string, string> = {
  online: 'bg-blue-100 text-blue-800',
  in_home: 'bg-amber-100 text-amber-800',
}

const statCards = [
  { key: 'totalToday', label: 'Total Bookings Today', icon: CalendarDays, color: 'bg-emerald-100 text-emerald-600' },
  { key: 'onlineBookings', label: 'Online Bookings', icon: Monitor, color: 'bg-blue-100 text-blue-600' },
  { key: 'offlineBookings', label: 'Offline Bookings', icon: Home, color: 'bg-amber-100 text-amber-600' },
  { key: 'childCareBookings', label: 'Child Care Bookings', icon: Baby, color: 'bg-pink-100 text-pink-600' },
  { key: 'elderCareBookings', label: 'Elder Care Bookings', icon: Users, color: 'bg-orange-100 text-orange-600' },
  { key: 'activeDoctors', label: 'Active Doctors', icon: Stethoscope, color: 'bg-teal-100 text-teal-600' },
] as const

export function DashboardSection() {
  const { setActiveSection } = useAppStore()
  const { toast } = useToast()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      } else {
        setStats({
          totalToday: 0,
          onlineBookings: 0,
          offlineBookings: 0,
          childCareBookings: 0,
          elderCareBookings: 0,
          activeDoctors: 0,
          recentBookings: [],
          doctorStatuses: { online: 0, offline: 0, blocked: 0, usingPortal: 0 },
        })
      }
    } catch {
      setStats({
        totalToday: 0,
        onlineBookings: 0,
        offlineBookings: 0,
        childCareBookings: 0,
        elderCareBookings: 0,
        activeDoctors: 0,
        recentBookings: [],
        doctorStatuses: { online: 0, offline: 0, blocked: 0, usingPortal: 0 },
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatValue = (key: string) => {
    if (!stats) return 0
    return (stats as Record<string, number | unknown>)[key] as number ?? 0
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.key} className="bg-white rounded-xl shadow-sm border-0 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', card.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-16 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{getStatValue(card.key)}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">{card.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Glance */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Quick Glance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Upcoming Appointments', 'Pending Verifications', 'Revenue Today', 'New Patients'].map((label) => (
              <div key={label} className="bg-gray-50 rounded-lg p-4 text-center">
                {loading ? (
                  <Skeleton className="h-6 w-12 mx-auto mb-2" />
                ) : (
                  <p className="text-2xl font-bold text-gray-400">—</p>
                )}
                <p className="text-xs text-gray-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">Fields will be configured later</p>
        </CardContent>
      </Card>

      {/* Recent Bookings Table */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Booking ID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Patient</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Doctor</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : stats?.recentBookings && stats.recentBookings.length > 0 ? (
                  stats.recentBookings.slice(0, 10).map((b) => (
                    <TableRow key={b.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs text-emerald-700 font-medium">{b.bookingId}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{b.patientName}</p>
                          {b.patientUhid && <p className="text-xs text-gray-400">{b.patientUhid}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{b.doctorName || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px]', typeColor[b.consultationMode] || 'bg-gray-100 text-gray-800')}>
                          {b.consultationMode === 'online' ? 'Online' : 'In-Home'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px] capitalize', statusColor[b.status] || 'bg-gray-100 text-gray-800')}>
                          {b.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{b.date}</TableCell>
                      <TableCell className="text-sm text-gray-600">{b.startTime}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                      No recent bookings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Doctor Status Overview */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Doctor Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-36" />
              ))}
            </div>
          ) : stats?.doctorStatuses ? (
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Online', count: stats.doctorStatuses.online, color: 'bg-green-500' },
                { label: 'Offline', count: stats.doctorStatuses.offline, color: 'bg-gray-400' },
                { label: 'Blocked', count: stats.doctorStatuses.blocked, color: 'bg-orange-500' },
                { label: 'Using Portal', count: stats.doctorStatuses.usingPortal, color: 'bg-teal-500' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
                  <div className={cn('w-2.5 h-2.5 rounded-full', s.color)} />
                  <span className="text-sm font-medium text-gray-700">{s.count}</span>
                  <span className="text-sm text-gray-500">{s.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" onClick={() => setActiveSection('doctors')}>
              <UserPlus className="w-4 h-4" /> Add Doctor
            </Button>
            <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" onClick={() => setActiveSection('bookings')}>
              <CalendarPlus className="w-4 h-4" /> Create Booking
            </Button>
            <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" onClick={() => setActiveSection('caregivers')}>
              <UserCheck className="w-4 h-4" /> Assign Caregiver
            </Button>
            <Button variant="outline" className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800" onClick={() => setActiveSection('analytics')}>
              <BarChart3 className="w-4 h-4" /> View Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}