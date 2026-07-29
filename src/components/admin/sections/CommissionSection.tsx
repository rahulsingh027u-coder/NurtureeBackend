'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  IndianRupee, TrendingUp, Wallet, Clock, RefreshCw, XCircle,
  ChevronRight, MoreVertical, CheckCircle2, AlertTriangle, ArrowUpDown,
  User, Eye,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface BookingCommission {
  commissionId: string
  bookingId: string
  totalAmount: number
  commissionRate: number
  commissionAmount: number
  doctorEarnings: number
  paymentStatus: string
  paidAt: string | null
  bookingDate: string
}

interface CommissionEntry {
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
  bookings: BookingCommission[]
}

interface CommissionSummary {
  totalCommission: number
  paidCommission: number
  pendingCommission: number
  overdueCommission: number
}

type SortKey = 'doctorName' | 'totalRevenue' | 'commissionRate' | 'commissionAmount' | 'bookingCount'
type SortDir = 'asc' | 'desc'
type StatusFilter = 'all' | 'paid' | 'pending' | 'overdue'

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const statusConfig: Record<string, { label: string; color: string; dot: string }> = {
  paid:    { label: 'Paid',    color: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-500' },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700',        dot: 'bg-red-500' },
}

const filterTabs: { key: StatusFilter; label: string }[] = [
  { key: 'all',     label: 'All' },
  { key: 'paid',    label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'overdue', label: 'Overdue' },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmt = (v: number) => `₹${v.toLocaleString('en-IN')}`

const fmtDate = (d: string) => {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function getWorstStatus(entry: CommissionEntry): string {
  if (entry.overdueAmount > 0) return 'overdue'
  if (entry.pendingAmount > 0) return 'pending'
  return 'paid'
}

function getPaidPercent(entry: CommissionEntry): number {
  if (entry.commissionAmount === 0) return 0
  return Math.round((entry.paidAmount / entry.commissionAmount) * 100)
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CommissionSection() {
  const { toast } = useToast()
  const [commissions, setCommissions] = useState<CommissionEntry[]>([])
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortKey, setSortKey] = useState<SortKey>('totalRevenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [search, setSearch] = useState('')

  // Detail sheet state
  const [selectedDoctor, setSelectedDoctor] = useState<CommissionEntry | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  /* ---------- Fetch ---------- */

  const fetchCommissions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/commission')
      if (res.ok) {
        const json = await res.json()
        setCommissions(Array.isArray(json.commissions) ? json.commissions : [])
        setSummary(json.summary || null)
      } else {
        toast({ title: 'Error', description: 'Failed to fetch commission data', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchCommissions() }, [fetchCommissions])

  /* ---------- Sort ---------- */

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  /* ---------- Filter + Sort ---------- */

  const filtered = commissions
    .filter(e => {
      if (statusFilter === 'all') return true
      return getWorstStatus(e) === statusFilter
    })
    .filter(e => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return e.doctorName.toLowerCase().includes(q) || (e.specialty ?? '').toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1
      const av = a[sortKey]
      const bv = b[sortKey]
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })

  const totalRevenue = commissions.reduce((s, c) => s + c.totalRevenue, 0)

  /* ---------- Status update ---------- */

  const updateStatus = async (commissionId: string, status: string) => {
    try {
      const res = await fetch('/api/commission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionId, paymentStatus: status }),
      })
      if (res.ok) {
        toast({ title: 'Updated', description: `Commission marked as ${status}` })
        fetchCommissions()
        // Refresh detail if open
        if (selectedDoctor) {
          setSelectedDoctor(prev => {
            if (!prev) return null
            return {
              ...prev,
              bookings: prev.bookings.map(b =>
                b.commissionId === commissionId ? { ...b, paymentStatus: status } : b
              ),
            }
          })
        }
      } else {
        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    }
  }

  const markAllAs = async (doctorId: string, status: string) => {
    setDetailLoading(true)
    try {
      const res = await fetch('/api/commission', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, markAllAs: status }),
      })
      if (res.ok) {
        toast({ title: 'Updated', description: `All commissions marked as ${status}` })
        fetchCommissions()
        // Close detail sheet after bulk update
        setSelectedDoctor(null)
      } else {
        toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  /* ---------- Sort header helper ---------- */

  const SortHead = ({ k, children }: { k: SortKey; children: React.ReactNode }) => (
    <TableHead
      className="text-xs font-semibold uppercase text-gray-500 text-right cursor-pointer select-none hover:text-gray-800 transition-colors"
      onClick={() => toggleSort(k)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <ArrowUpDown className={cn('w-3 h-3', sortKey === k ? 'text-blue-600' : 'text-gray-300')} />
      </span>
    </TableHead>
  )

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* -------- Summary Cards -------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard icon={<IndianRupee className="w-5 h-5" />} bg="bg-blue-50" iconBg="bg-blue-100 text-blue-600"
          value={loading ? null : fmt(totalRevenue)} label="Total Revenue" />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} bg="bg-indigo-50" iconBg="bg-indigo-100 text-indigo-600"
          value={loading ? null : fmt(summary?.totalCommission ?? 0)} label="Platform Commission" />
        <StatCard icon={<Wallet className="w-5 h-5" />} bg="bg-emerald-50" iconBg="bg-emerald-100 text-emerald-600"
          value={loading ? null : fmt(summary?.paidCommission ?? 0)} label="Commission Paid" />
        <StatCard icon={<Clock className="w-5 h-5" />} bg="bg-amber-50" iconBg="bg-amber-100 text-amber-600"
          value={loading ? null : fmt(summary?.pendingCommission ?? 0)} label="Commission Pending" />
        <StatCard icon={<XCircle className="w-5 h-5" />} bg="bg-red-50" iconBg="bg-red-100 text-red-600"
          value={loading ? null : fmt(summary?.overdueCommission ?? 0)} label="Commission Overdue" />
      </div>

      {/* -------- Table Card -------- */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        {/* Toolbar */}
        <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-gray-900">Doctor Commission Overview</CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <input
              type="text"
              placeholder="Search doctor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 px-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-gray-50 w-full sm:w-44"
            />
            <Button size="sm" variant="outline"
              className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5 shrink-0"
              onClick={fetchCommissions} disabled={loading}>
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1 px-4 pt-2 pb-3 border-b border-gray-100">
            {filterTabs.map(f => {
              const count = f.key === 'all'
                ? commissions.length
                : commissions.filter(e => getWorstStatus(e) === f.key).length
              return (
                <button
                  key={f.key}
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full transition-all',
                    statusFilter === f.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
                  )}
                >
                  {f.label}{' '}
                  <span className={cn('ml-0.5', statusFilter === f.key ? 'text-blue-100' : 'text-gray-400')}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Table */}
          <div className="max-h-[480px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Doctor</TableHead>
                  <SortHead k="bookingCount">Bookings</SortHead>
                  <SortHead k="totalRevenue">Revenue</SortHead>
                  <SortHead k="commissionRate">Rate</SortHead>
                  <SortHead k="commissionAmount">Commission</SortHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-right">Earnings</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-right">Paid %</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-14" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((c) => {
                    const worst = getWorstStatus(c)
                    const paidPct = getPaidPercent(c)
                    const cfg = statusConfig[worst] || statusConfig.pending
                    return (
                      <TableRow
                        key={c.id}
                        className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                        onClick={() => setSelectedDoctor(c)}
                      >
                        {/* Doctor */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={c.profileImage ?? undefined} alt={c.doctorName} />
                              <AvatarFallback className="text-[11px] bg-blue-100 text-blue-700">
                                {getInitials(c.doctorName)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                                {c.doctorName}
                              </p>
                              {c.specialty && <p className="text-[11px] text-gray-400">{c.specialty}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700 text-right font-mono">{c.bookingCount}</TableCell>
                        <TableCell className="text-sm text-gray-700 text-right font-mono">{fmt(c.totalRevenue)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="text-[11px] font-mono border-blue-200 text-blue-700">
                            {c.commissionRate}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-blue-700 text-right font-medium font-mono">{fmt(c.commissionAmount)}</TableCell>
                        <TableCell className="text-sm text-gray-700 text-right font-mono">{fmt(c.doctorEarnings)}</TableCell>
                        {/* Status */}
                        <TableCell>
                          <Badge variant="secondary" className={cn('text-[11px] capitalize', cfg.color)}>
                            <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1', cfg.dot)} />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        {/* Paid progress bar (clickable) */}
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <button
                            className="flex items-center gap-2 ml-auto w-full max-w-[100px] group/bar"
                            onClick={() => setSelectedDoctor(c)}
                            title={`${paidPct}% paid — click for details`}
                          >
                            <Progress value={paidPct} className="h-2 flex-1" />
                            <span className="text-[11px] text-gray-500 font-mono min-w-[28px] text-right">{paidPct}%</span>
                          </button>
                        </TableCell>
                        {/* Actions */}
                        <TableCell onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreVertical className="w-4 h-4 text-gray-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedDoctor(c)}>
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => markAllAs(c.doctorId, 'paid')} disabled={detailLoading}>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Mark All Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => markAllAs(c.doctorId, 'overdue')} disabled={detailLoading}>
                                <AlertTriangle className="w-4 h-4 mr-2" /> Mark All Overdue
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      <div className="flex flex-col items-center gap-1">
                        <Wallet className="w-8 h-8 text-gray-300" />
                        <p className="text-gray-400 text-sm">
                          {search ? 'No doctors match your search' : 'No commission data available'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* -------- Doctor Detail Sheet -------- */}
      <Sheet open={!!selectedDoctor} onOpenChange={open => !open && setSelectedDoctor(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedDoctor && <DoctorDetailSheet
            doctor={selectedDoctor}
            onStatusChange={updateStatus}
            onMarkAll={markAllAs}
            loading={detailLoading}
          />}
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
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', iconBg)}>
          {icon}
        </div>
        <div className="min-w-0">
          {value === null
            ? <Skeleton className="h-7 w-16" />
            : <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
          }
          <p className="text-[11px] text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function DoctorDetailSheet({ doctor, onStatusChange, onMarkAll, loading }: {
  doctor: CommissionEntry
  onStatusChange: (id: string, status: string) => void
  onMarkAll: (doctorId: string, status: string) => void
  loading: boolean
}) {
  const paidPct = getPaidPercent(doctor)
  const worst = getWorstStatus(doctor)
  const cfg = statusConfig[worst] || statusConfig.pending

  return (
    <div className="space-y-5 pt-2">
      {/* Header */}
      <SheetHeader>
        <SheetTitle className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={doctor.profileImage ?? undefined} alt={doctor.doctorName} />
            <AvatarFallback className="bg-blue-100 text-blue-700">{getInitials(doctor.doctorName)}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="font-semibold text-gray-900">{doctor.doctorName}</p>
            {doctor.specialty && <p className="text-sm text-gray-500">{doctor.specialty}</p>}
          </div>
        </SheetTitle>
      </SheetHeader>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <MiniStat label="Total Revenue" value={fmt(doctor.totalRevenue)} />
        <MiniStat label="Commission Rate" value={`${doctor.commissionRate}%`} />
        <MiniStat label="Platform Commission" value={fmt(doctor.commissionAmount)} />
        <MiniStat label="Doctor Earnings" value={fmt(doctor.doctorEarnings)} />
      </div>

      {/* Payment progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Payment Progress</span>
          <span className="font-mono text-gray-500">{paidPct}%</span>
        </div>
        <Progress value={paidPct} className="h-3" />
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="text-center">
            <p className="text-xs text-gray-400">Paid</p>
            <p className="text-sm font-semibold text-emerald-600">{fmt(doctor.paidAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-sm font-semibold text-amber-600">{fmt(doctor.pendingAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Overdue</p>
            <p className="text-sm font-semibold text-red-600">{fmt(doctor.overdueAmount)}</p>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-2">
        <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          onClick={() => onMarkAll(doctor.doctorId, 'paid')} disabled={loading}>
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Mark All Paid
        </Button>
        <Button size="sm" variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50 text-xs"
          onClick={() => onMarkAll(doctor.doctorId, 'overdue')} disabled={loading}>
          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Mark All Overdue
        </Button>
      </div>

      {/* Booking breakdown table */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-gray-700">
          Booking Breakdown ({doctor.bookings.length})
        </p>
        <div className="rounded-lg border border-gray-100 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                <TableHead className="text-[11px]">Booking</TableHead>
                <TableHead className="text-[11px] text-right">Amount</TableHead>
                <TableHead className="text-[11px] text-right">Commission</TableHead>
                <TableHead className="text-[11px]">Status</TableHead>
                <TableHead className="text-[11px]">Date</TableHead>
                <TableHead className="w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctor.bookings.map(b => {
                const bCfg = statusConfig[b.paymentStatus] || statusConfig.pending
                return (
                  <TableRow key={b.commissionId} className="hover:bg-gray-50/50">
                    <TableCell className="text-xs font-mono text-gray-700">{b.bookingId}</TableCell>
                    <TableCell className="text-xs text-gray-700 text-right font-mono">{fmt(b.totalAmount)}</TableCell>
                    <TableCell className="text-xs text-blue-700 text-right font-mono font-medium">{fmt(b.commissionAmount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={cn('text-[10px] capitalize', bCfg.color)}>
                        <span className={cn('inline-block w-1 h-1 rounded-full mr-1', bCfg.dot)} />
                        {b.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">{fmtDate(b.bookingDate)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onStatusChange(b.commissionId, 'paid')}>
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Mark Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onStatusChange(b.commissionId, 'pending')}>
                            <Clock className="w-3.5 h-3.5 mr-2" /> Mark Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onStatusChange(b.commissionId, 'overdue')}>
                            <AlertTriangle className="w-3.5 h-3.5 mr-2" /> Mark Overdue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
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
