'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  Search, Eye, CalendarDays, IndianRupee, X,
  MapPin, FileText, Building2, Phone, User, Stethoscope, Wifi, WifiOff, CheckCircle, XCircle,
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
  online: 'bg-teal-100 text-teal-800',
  in_home: 'bg-amber-100 text-amber-800',
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
  const [modeFilter, setModeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [cardFilter, setCardFilter] = useState<string | null>(null)

  // Card click handler: sets the right filter (status or mode)
  const handleCardClick = (filterValue: string, filterType: 'status' | 'mode' | 'today' | 'all') => {
    if (cardFilter === filterValue) {
      // Deselect
      setCardFilter(null)
      if (filterType === 'status') setStatusFilter('all')
      else if (filterType === 'mode') setModeFilter('all')
      else if (filterType === 'today') { setDateFrom(''); setDateTo('') }
    } else {
      setCardFilter(filterValue)
      if (filterType === 'status') setStatusFilter(filterValue)
      else if (filterType === 'mode') setModeFilter(filterValue)
      else if (filterType === 'today') {
        const today = new Date().toISOString().split('T')[0]
        setDateFrom(today)
        setDateTo(today)
      }
    }
  }

  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams()
    params.set('page', '1')
    params.set('limit', '100')
    if (modeFilter !== 'all') params.set('mode', modeFilter)
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    if (search) params.set('search', search)
    return params.toString()
  }, [modeFilter, statusFilter, dateFrom, dateTo, search])

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const qs = buildQueryString()
      const res = await fetch(`/api/bookings?${qs}`)
      if (res.ok) {
        const data = await res.json()
        const list: Booking[] = Array.isArray(data) ? data : data.bookings || []
        setBookings(list)
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
    setModeFilter('all')
    setStatusFilter('all')
    setServiceFilter('all')
    setSearchInput('')
    setSearch('')
  }

  const hasActiveFilters = dateFrom || dateTo || modeFilter !== 'all' || statusFilter !== 'all' || serviceFilter !== 'all' || search

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setDetailOpen(true)
  }

  // Client-side service filter (API doesn't support service filter param)
  const filteredBookings = serviceFilter === 'all'
    ? bookings
    : bookings.filter(b => b.serviceName?.toLowerCase().includes(serviceFilter.toLowerCase()))

  // Stat calculations
  const totalBookings = bookings.length
  const todayStr = new Date().toISOString().split('T')[0]
  const todaysCount = bookings.filter(b => b.date === todayStr).length
  const onlineCount = bookings.filter(b => b.mode === 'online').length
  const offlineCount = bookings.filter(b => b.mode === 'in_home').length
  const completedCount = bookings.filter(b => b.status === 'completed').length
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length

  // Unique services for service filter dropdown
  const uniqueServices = Array.from(new Set(bookings.map(b => b.serviceName).filter(Boolean))).sort()

  const statCards = [
    { label: 'Total Bookings', value: totalBookings, icon: CalendarDays, bg: 'bg-blue-100', text: 'text-blue-600', filterValue: 'all', filterType: 'all' as const },
    { label: "Today's", value: todaysCount, icon: CalendarDays, bg: 'bg-amber-100', text: 'text-amber-600', filterValue: 'today', filterType: 'today' as const },
    { label: 'Online', value: onlineCount, icon: Wifi, bg: 'bg-teal-100', text: 'text-teal-600', filterValue: 'online', filterType: 'mode' as const },
    { label: 'Offline', value: offlineCount, icon: WifiOff, bg: 'bg-amber-100', text: 'text-amber-600', filterValue: 'in_home', filterType: 'mode' as const },
    { label: 'Completed', value: completedCount, icon: CheckCircle, bg: 'bg-green-100', text: 'text-green-600', filterValue: 'completed', filterType: 'status' as const },
    { label: 'Cancelled', value: cancelledCount, icon: XCircle, bg: 'bg-red-100', text: 'text-red-600', filterValue: 'cancelled', filterType: 'status' as const },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Stat Cards - 6 in a row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((s) => {
          const isActive = cardFilter === s.filterValue
          return (
            <Card
              key={s.label}
              className={cn(
                'bg-white rounded-xl shadow-sm border-0 transition-all duration-150 cursor-pointer hover:shadow-md hover:-translate-y-0.5',
                isActive && 'ring-2 ring-offset-1 ring-blue-500 shadow-md'
              )}
              onClick={() => handleCardClick(s.filterValue, s.filterType)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors', s.bg, s.text, isActive && 'ring-2 ring-current opacity-80')}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  {loading ? (
                    <Skeleton className="h-6 w-10 mb-1" />
                  ) : (
                    <p className="text-xl font-bold text-gray-900 truncate">
                      {s.value}
                    </p>
                  )}
                  <p className={cn('text-[11px] truncate', isActive ? 'text-blue-600 font-medium' : 'text-gray-500')}>{s.label}</p>
                </div>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bookings Table Card */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-4 space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by booking ID, patient, or doctor..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-10 text-sm w-full"
            />
          </form>

          {/* Filter Row: Date Range + 3 Dropdowns */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-semibold text-gray-400">Date From</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 text-sm w-36"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-semibold text-gray-400">Date To</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 text-sm w-36"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-semibold text-gray-400">Mode</label>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="h-9 text-sm w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in_home">Offline</SelectItem>
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
              <label className="text-[11px] uppercase font-semibold text-gray-400">Service</label>
              <Select value={serviceFilter} onValueChange={setServiceFilter}>
                <SelectTrigger className="h-9 text-sm w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {uniqueServices.map((s) => (
                    <SelectItem key={s} value={s!}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-9 text-gray-500 hover:text-gray-700" onClick={clearFilters}>
                Clear
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
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">UHID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Doctor</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Date & Time</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Mode</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Service</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 10 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredBookings.length > 0 ? (
                  filteredBookings.map((b) => (
                    <TableRow key={b.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs text-blue-700 font-medium">{b.bookingId}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">{b.patientName}</TableCell>
                      <TableCell>
                        {b.patientUhid ? (
                          <span className="text-xs font-mono text-blue-600 hover:underline cursor-pointer">
                            {b.patientUhid}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{b.doctorName || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">
                        {b.date}{b.startTime ? ` ${b.startTime}` : ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(
                          'text-[11px] capitalize',
                          modeColor[b.mode] || 'bg-gray-100 text-gray-800'
                        )}>
                          {b.mode === 'in_home' ? 'Offline' : b.mode === 'online' ? 'Online' : b.mode || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{b.serviceName || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(
                          'text-[11px] capitalize',
                          statusColor[b.status] || 'bg-gray-100 text-gray-800'
                        )}>
                          {b.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">
                        {b.amount != null ? `₹${b.amount.toLocaleString('en-IN')}` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleViewBooking(b)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-400 text-sm">
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
              <CalendarDays className="w-5 h-5 text-blue-600" />
              Booking Details
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-5">
              {/* Booking ID & Status Row */}
              <div className="flex items-center justify-between">
                <p className="font-mono text-sm text-blue-700 font-medium">{selectedBooking.bookingId}</p>
                <Badge variant="secondary" className={cn('text-xs capitalize', statusColor[selectedBooking.status] || 'bg-gray-100 text-gray-800')}>
                  {selectedBooking.status.replace('_', ' ')}
                </Badge>
              </div>

              {/* Patient Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Patient Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[11px] text-gray-400">Patient Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedBooking.patientName}</p>
                  </div>
                  {selectedBooking.patientUhid && (
                    <div>
                      <p className="text-[11px] text-gray-400">UHID</p>
                      <p className="text-sm font-mono text-blue-600">{selectedBooking.patientUhid}</p>
                    </div>
                  )}
                  {selectedBooking.patientPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-3" />
                      <div>
                        <p className="text-[11px] text-gray-400">Phone</p>
                        <p className="text-sm font-medium text-gray-900">{selectedBooking.patientPhone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Doctor & Service Info */}
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
                    <p className="text-[11px] text-gray-400">Mode</p>
                    <Badge variant="secondary" className={cn('text-[11px] capitalize mt-0.5', modeColor[selectedBooking.mode] || 'bg-gray-100 text-gray-800')}>
                      {selectedBooking.mode === 'in_home' ? 'Offline' : selectedBooking.mode || '-'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Type</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {selectedBooking.type?.replace('_', ' ') || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400">Source</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">
                      {selectedBooking.source || '-'}
                    </p>
                  </div>
                  <div>
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
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <h4 className="text-xs font-semibold text-blue-600 uppercase flex items-center gap-1.5">
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
                    <p className="text-sm font-bold text-blue-700">
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