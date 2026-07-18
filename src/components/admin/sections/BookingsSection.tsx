'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Search, Eye, Filter, X, CalendarDays, User, IndianRupee,
  Clock, MapPin, FileText, Building2, Globe, Phone,
} from 'lucide-react'

interface Booking {
  id: string
  bookingId: string
  patientId: string
  patientName: string
  patientUhid?: string
  patientPhone?: string
  doctorId?: string
  doctorName?: string
  serviceId?: string
  serviceName?: string
  type: string
  mode: string
  status: string
  source?: string
  date: string
  startTime?: string
  endTime?: string
  address?: string
  notes?: string
  amount?: number
  commissionAmount?: number
  commissionPercent?: number
  netAmount?: number
  createdAt?: string
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const modeColor: Record<string, string> = {
  online: 'bg-blue-100 text-blue-800',
  in_home: 'bg-amber-100 text-amber-800',
}

const sourceColor: Record<string, string> = {
  portal: 'bg-emerald-100 text-emerald-800',
  website: 'bg-violet-100 text-violet-800',
  admin: 'bg-gray-200 text-gray-800',
}

export function BookingsSection() {
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [modeFilter, setModeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('limit', '100')
    if (typeFilter !== 'all') params.set('type', typeFilter)
    if (modeFilter !== 'all') params.set('mode', modeFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (search) params.set('search', search)
    return params.toString()
  }, [typeFilter, modeFilter, statusFilter, dateFrom, dateTo, search])

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const qs = buildQueryString()
      const res = await fetch(`/api/bookings?${qs}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(Array.isArray(data) ? data : data.bookings || [])
      } else {
        toast({ title: 'Error', description: 'Failed to fetch bookings', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch bookings', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [buildQueryString, toast])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setTypeFilter('all')
    setModeFilter('all')
    setStatusFilter('all')
    setSearchInput('')
    setSearch('')
  }

  const hasActiveFilters = dateFrom || dateTo || typeFilter !== 'all' || modeFilter !== 'all' || statusFilter !== 'all' || search

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setDetailOpen(true)
  }

  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((sum, b) => sum + (b.amount || 0), 0)
  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const completedCount = bookings.filter(b => b.status === 'completed').length

  const formatLabel = (str: string) => str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>}
              <p className="text-xs text-gray-500">Total Bookings</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>}
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold text-gray-900">{completedCount}</p>}
              <p className="text-xs text-gray-500">Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>}
              <p className="text-xs text-gray-500">Revenue (Completed)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            All Bookings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Advanced Filters Row */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-semibold text-gray-400">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 text-sm w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-semibold text-gray-400">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 text-sm w-40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-semibold text-gray-400">Type</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 text-sm w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="doctor_consultation">Doctor Consultation</SelectItem>
                  <SelectItem value="child_care">Child Care</SelectItem>
                  <SelectItem value="elder_care">Elder Care</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-semibold text-gray-400">Mode</label>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="h-9 text-sm w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in_home">In-Home</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-semibold text-gray-400">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-sm w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-semibold text-gray-400">Search</label>
              <form onSubmit={handleSearch} className="flex items-center gap-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input
                    placeholder="Name, Booking ID..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-8 h-9 text-sm w-48"
                  />
                </div>
                <Button type="submit" size="sm" variant="outline" className="h-9 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                  <Search className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-gray-500 hover:text-gray-700" onClick={clearFilters}>
                <X className="w-3.5 h-3.5 mr-1" /> Clear Filters
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Booking ID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Patient</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Doctor</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Service</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Source</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Time</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : bookings.length > 0 ? (
                  bookings.map((b) => (
                    <TableRow key={b.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs text-emerald-700 font-medium">{b.bookingId}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-gray-900">{b.patientName}</p>
                        {b.patientUhid && <p className="text-xs text-gray-400 font-mono">{b.patientUhid}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{b.doctorName || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-700">{b.serviceName || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px] capitalize', modeColor[b.mode] || 'bg-gray-100 text-gray-800')}>
                          {b.mode.replace('_', '-')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px] capitalize', statusColor[b.status] || 'bg-gray-100 text-gray-800')}>
                          {b.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px] capitalize', sourceColor[b.source || ''] || 'bg-gray-100 text-gray-800')}>
                          {b.source || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{b.date}</TableCell>
                      <TableCell className="text-sm text-gray-600">{b.startTime || '-'}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {b.amount != null ? `₹${b.amount.toLocaleString('en-IN')}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleViewBooking(b)}
                        >
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-400 text-sm">
                      {hasActiveFilters ? 'No bookings found matching your filters' : 'No bookings found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Booking Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-600" />
              Booking Details
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-5">
              {/* Booking ID & Status Row */}
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-emerald-700 font-medium">{selectedBooking.bookingId}</p>
                <Badge variant="secondary" className={cn('text-xs capitalize', statusColor[selectedBooking.status] || 'bg-gray-100 text-gray-800')}>
                  {selectedBooking.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Patient Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Patient Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{selectedBooking.patientName}</p>
                    {selectedBooking.patientUhid && (
                      <p className="text-xs font-mono text-emerald-600 mt-0.5">{selectedBooking.patientUhid}</p>
                    )}
                  </div>
                  {selectedBooking.patientPhone && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {selectedBooking.patientPhone}
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> Doctor & Service
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-gray-400">Doctor</p>
                    <p className="text-sm font-medium text-gray-900">{selectedBooking.doctorName || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Service</p>
                    <p className="text-sm font-medium text-gray-900">{selectedBooking.serviceName || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" /> Booking Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-gray-400">Date</p>
                    <p className="text-sm font-medium text-gray-900">{selectedBooking.date}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Time</p>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedBooking.startTime || '-'}
                      {selectedBooking.endTime ? ` - ${selectedBooking.endTime}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Type</p>
                    <Badge variant="secondary" className={cn('text-[11px] capitalize mt-0.5', modeColor[selectedBooking.mode] || 'bg-gray-100 text-gray-800')}>
                      {selectedBooking.mode?.replace('_', '-') || '-'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Source</p>
                    <Badge variant="secondary" className={cn('text-[11px] capitalize mt-0.5', sourceColor[selectedBooking.source || ''] || 'bg-gray-100 text-gray-800')}>
                      {selectedBooking.source || '-'}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-gray-400">Created</p>
                    <p className="text-sm font-medium text-gray-900">{selectedBooking.createdAt || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              {selectedBooking.address && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Address
                  </h4>
                  <p className="text-sm text-gray-700">{selectedBooking.address}</p>
                </div>
              )}

              {/* Notes */}
              {selectedBooking.notes && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Notes
                  </h4>
                  <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
                </div>
              )}

              {/* Amount & Commission */}
              <div className="bg-emerald-50 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-emerald-600 uppercase flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5" /> Financial Details
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <p className="text-[11px] text-gray-500">Amount</p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedBooking.amount != null ? `₹${selectedBooking.amount.toLocaleString('en-IN')}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Commission %</p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedBooking.commissionPercent != null ? `${selectedBooking.commissionPercent}%` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Commission</p>
                    <p className="text-sm font-bold text-emerald-700">
                      {selectedBooking.commissionAmount != null ? `₹${selectedBooking.commissionAmount.toLocaleString('en-IN')}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500">Net Amount</p>
                    <p className="text-sm font-bold text-gray-900">
                      {selectedBooking.netAmount != null ? `₹${selectedBooking.netAmount.toLocaleString('en-IN')}` : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}