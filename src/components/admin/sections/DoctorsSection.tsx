'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Plus, Search, Eye, Ban, CheckCircle, Loader2, Stethoscope, FileText,
  DollarSign, Wifi, WifiOff, ShieldOff, Monitor, MoreVertical,
} from 'lucide-react'

interface Doctor {
  id: string
  name: string
  email: string
  phone: string
  specialty: string
  qualifications: string
  experience: number
  area: string
  feeOnline: number
  feeAtHome: number
  commissionRate: number
  isOnline: boolean
  isPortalUser: boolean
  isBlocked: boolean
  verified: boolean
  bookingCount: number
  totalEarnings: number
  commissionDue: number
  avgRating: number
  totalConsultations: number
}

interface Booking {
  id: string
  bookingId: string
  patientName: string
  patientUhid?: string
  date: string
  status: string
}

interface Prescription {
  id: string
  patientName: string
  date: string
  diagnosis?: string
}

const bookingStatusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

const specialtyOptions = [
  'Gynaecologist & IVF Specialist',
  'Gynaecologist & Obstetrician',
  'General Physician & Internal Medicine',
  'Geriatric Specialist & Internal Medicine',
  'General Physician & Family Doctor',
  'Pediatrician',
]

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  specialty: '',
  qualifications: '',
  experience: '',
  area: '',
  feeOnline: '',
  feeAtHome: '',
  commissionRate: '15',
}

export function DoctorsSection() {
  const { toast } = useToast()

  // Data state
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [specFilter, setSpecFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')

  // Add doctor dialog
  const [addOpen, setAddOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)

  // View doctor dialog
  const [viewOpen, setViewOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [doctorBookings, setDoctorBookings] = useState<Booking[]>([])
  const [doctorPrescriptions, setDoctorPrescriptions] = useState<Prescription[]>([])

  // Block/Unblock dialog
  const [blockOpen, setBlockOpen] = useState(false)
  const [blocking, setBlocking] = useState(false)

  // 3-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Fetch doctors
  useEffect(() => {
    fetchDoctors()
  }, [search, statusFilter, specFilter, verifiedFilter])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (specFilter !== 'all') params.set('specialization', specFilter)
      if (verifiedFilter !== 'all') params.set('verified', verifiedFilter)

      const res = await fetch(`/api/doctors?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDoctors(Array.isArray(data) ? data : data.data || [])
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch doctors', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Derived stats
  const totalDoctors = doctors.length
  const onlineCount = doctors.filter(d => d.isOnline && !d.isBlocked).length
  const offlineCount = doctors.filter(d => !d.isOnline && !d.isBlocked).length
  const blockedCount = doctors.filter(d => d.isBlocked).length
  const portalCount = doctors.filter(d => d.isPortalUser).length

  // Get doctor status string
  const getDoctorStatus = (d: Doctor): string => {
    if (d.isBlocked) return 'blocked'
    if (d.isOnline) return 'online'
    return 'offline'
  }

  // Create doctor
  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.specialty) {
      toast({ title: 'Error', description: 'Please fill required fields (name, email, password, specialty)', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const payload = {
        ...form,
        experience: Number(form.experience) || 0,
        feeOnline: Number(form.feeOnline) || 0,
        feeAtHome: Number(form.feeAtHome) || 0,
        commissionRate: Number(form.commissionRate) || 15,
      }
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Doctor Added', description: `${form.name} has been added successfully` })
        setAddOpen(false)
        setForm(emptyForm)
        fetchDoctors()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to add doctor', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  // View doctor details
  const handleViewDoctor = async (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setViewOpen(true)
    setViewLoading(true)
    setOpenMenuId(null)
    try {
      const [bookingsRes, prescriptionsRes] = await Promise.all([
        fetch(`/api/bookings?doctorId=${doctor.id}`),
        fetch(`/api/prescriptions?doctorId=${doctor.id}`),
      ])
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setDoctorBookings(Array.isArray(data) ? data : data.data || [])
      }
      if (prescriptionsRes.ok) {
        const data = await prescriptionsRes.json()
        setDoctorPrescriptions(Array.isArray(data) ? data : data.data || [])
      }
    } catch {
      // Silently fail
    } finally {
      setViewLoading(false)
    }
  }

  // Block / Unblock
  const handleBlockToggle = async () => {
    if (!selectedDoctor) return
    setBlocking(true)
    try {
      const isBlocked = !selectedDoctor.isBlocked
      const res = await fetch(`/api/doctors/${selectedDoctor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isBlocked,
          blockReason: isBlocked ? 'Commission unpaid' : undefined,
        }),
      })
      if (res.ok) {
        toast({
          title: isBlocked ? 'Doctor Blocked' : 'Doctor Unblocked',
          description: `${selectedDoctor.name} has been ${isBlocked ? 'blocked' : 'unblocked'}`,
        })
        setBlockOpen(false)
        setViewOpen(false)
        fetchDoctors()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update doctor', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setBlocking(false)
    }
  }

  const openBlockDialog = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setBlockOpen(true)
    setOpenMenuId(null)
  }

  // Revenue calculations for view dialog
  const completedBookings = doctorBookings.filter(b => b.status === 'completed').length

  // Stat cards config
  const statCards = [
    { label: 'Total Doctors', value: totalDoctors, icon: Stethoscope, color: 'bg-blue-50', iconColor: 'text-blue-600', valueColor: 'text-blue-700' },
    { label: 'Online', value: onlineCount, icon: Wifi, color: 'bg-green-50', iconColor: 'text-green-500', valueColor: 'text-green-700' },
    { label: 'Offline', value: offlineCount, icon: WifiOff, color: 'bg-gray-50', iconColor: 'text-gray-400', valueColor: 'text-gray-700' },
    { label: 'Blocked', value: blockedCount, icon: ShieldOff, color: 'bg-red-50', iconColor: 'text-red-500', valueColor: 'text-red-700' },
    { label: 'Using Portal', value: portalCount, icon: Monitor, color: 'bg-purple-50', iconColor: 'text-purple-500', valueColor: 'text-purple-700' },
  ]

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search doctors by name, email, or phone..."
            className="pl-9 h-9 rounded-lg border-gray-200 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-lg border-gray-200 text-sm">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={specFilter} onValueChange={setSpecFilter}>
          <SelectTrigger className="w-full sm:w-[170px] h-9 rounded-lg border-gray-200 text-sm">
            <SelectValue placeholder="All Specializations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specializations</SelectItem>
            {specialtyOptions.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
          <SelectTrigger className="w-full sm:w-[100px] h-9 rounded-lg border-gray-200 text-sm">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Verified</SelectItem>
            <SelectItem value="false">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards - 5 in a row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="bg-white rounded-lg shadow-sm border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', card.color)}>
                <card.icon className={cn('w-5 h-5', card.iconColor)} />
              </div>
              <div>
                <p className={cn('text-xl font-bold leading-tight', card.valueColor)}>{loading ? '—' : card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Doctors Table */}
      <Card className="bg-white rounded-lg shadow-sm border-0 overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Doctors</h3>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-8 text-xs font-medium rounded-lg">
                <Plus className="w-3.5 h-3.5" /> Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Doctor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Name *</Label>
                    <Input placeholder="Dr. Full Name" className="h-9 text-sm rounded-lg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Email *</Label>
                    <Input type="email" placeholder="doctor@example.com" className="h-9 text-sm rounded-lg" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Phone</Label>
                    <Input placeholder="+91 98765 43210" className="h-9 text-sm rounded-lg" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Password *</Label>
                    <Input type="password" placeholder="Set password" className="h-9 text-sm rounded-lg" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Specialty *</Label>
                    <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                      <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue placeholder="Select specialty" /></SelectTrigger>
                      <SelectContent>
                        {specialtyOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Experience (years)</Label>
                    <Input type="number" placeholder="e.g. 5" className="h-9 text-sm rounded-lg" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Qualifications</Label>
                  <Input placeholder="MBBS, MD, etc." className="h-9 text-sm rounded-lg" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Area</Label>
                  <Input placeholder="City or locality" className="h-9 text-sm rounded-lg" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Fee Online</Label>
                    <Input type="number" placeholder="500" className="h-9 text-sm rounded-lg" value={form.feeOnline} onChange={(e) => setForm({ ...form, feeOnline: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Fee At Home</Label>
                    <Input type="number" placeholder="800" className="h-9 text-sm rounded-lg" value={form.feeAtHome} onChange={(e) => setForm({ ...form, feeAtHome: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Commission %</Label>
                    <Input type="number" placeholder="15" className="h-9 text-sm rounded-lg" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)} className="rounded-lg">Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Doctor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-0">
                <TableHead className="text-xs font-semibold uppercase text-gray-500 h-10 pl-5">Name</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500 h-10">Phone</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500 h-10">Status</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500 h-10">Fee (On/Off)</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500 h-10">Comm. %</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500 h-10">Bookings</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500 h-10">Earnings</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500 h-10">Verified</TableHead>
                <TableHead className="text-xs font-semibold uppercase text-gray-500 h-10 pr-5 w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-0">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <TableCell key={j} className={j === 0 ? 'pl-5' : j === 8 ? 'pr-5' : ''}><Skeleton className="h-4 w-20" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : doctors.length > 0 ? (
                doctors.map((d) => {
                  const status = getDoctorStatus(d)
                  return (
                    <TableRow key={d.id} className="hover:bg-gray-50/50 border-0 border-b border-gray-100 last:border-0">
                      {/* Name & Specialization */}
                      <TableCell className="pl-5 py-3">
                        <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{d.specialty}</p>
                      </TableCell>
                      {/* Phone */}
                      <TableCell className="py-3">
                        <p className="text-sm text-gray-700">{d.phone}</p>
                      </TableCell>
                      {/* Status */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            'w-2 h-2 rounded-full inline-block',
                            status === 'online' ? 'bg-green-500' : status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                          )} />
                          <span className={cn(
                            'text-xs font-medium capitalize',
                            status === 'online' ? 'text-green-700' : status === 'blocked' ? 'text-red-700' : 'text-gray-600'
                          )}>
                            {status}
                          </span>
                        </div>
                      </TableCell>
                      {/* Fee */}
                      <TableCell className="py-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{d.feeOnline > 0 ? `₹${d.feeOnline.toLocaleString()}` : '₹0'}</span>
                          <span className="text-gray-400 mx-0.5">/</span>
                          <span>{d.feeAtHome > 0 ? `₹${d.feeAtHome.toLocaleString()}` : '₹0'}</span>
                        </p>
                      </TableCell>
                      {/* Commission */}
                      <TableCell className="py-3">
                        <p className="text-sm font-medium text-gray-700">{d.commissionRate}%</p>
                      </TableCell>
                      {/* Bookings */}
                      <TableCell className="py-3">
                        <p className="text-sm text-gray-700">{d.bookingCount || 0}</p>
                      </TableCell>
                      {/* Earnings */}
                      <TableCell className="py-3">
                        <p className="text-sm font-medium text-gray-900">{d.totalEarnings > 0 ? `₹${d.totalEarnings.toLocaleString()}` : '₹0'}</p>
                      </TableCell>
                      {/* Verified */}
                      <TableCell className="py-3">
                        {d.verified ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-gray-300 inline-block" />
                        )}
                      </TableCell>
                      {/* Actions - 3 dot menu */}
                      <TableCell className="py-3 pr-5">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 rounded-lg hover:bg-gray-100"
                            onClick={() => setOpenMenuId(openMenuId === d.id ? null : d.id)}
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </Button>
                          {openMenuId === d.id && (
                            <div ref={menuRef} className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                              <button
                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                onClick={() => handleViewDoctor(d)}
                              >
                                <Eye className="w-3.5 h-3.5 text-gray-400" /> View Details
                              </button>
                              <button
                                className={cn(
                                  'w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2',
                                  d.isBlocked ? 'text-green-600' : 'text-red-600'
                                )}
                                onClick={() => openBlockDialog(d)}
                              >
                                {d.isBlocked ? (
                                  <><CheckCircle className="w-3.5 h-3.5" /> Unblock</>
                                ) : (
                                  <><Ban className="w-3.5 h-3.5" /> Block</>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow className="border-0">
                  <TableCell colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                    No doctors found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* View Doctor Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDoctor && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                    <Stethoscope className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p>{selectedDoctor.name}</p>
                    <p className="text-sm font-normal text-gray-500">{selectedDoctor.specialty}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {/* Doctor Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-3">
                <InfoItem label="Email" value={selectedDoctor.email} />
                <InfoItem label="Phone" value={selectedDoctor.phone || '—'} />
                <InfoItem label="Area" value={selectedDoctor.area || '—'} />
                <InfoItem label="Experience" value={`${selectedDoctor.experience || 0} years`} />
                <InfoItem label="Qualifications" value={selectedDoctor.qualifications || '—'} />
                <InfoItem label="Status" value={
                  <span className={cn(
                    'inline-flex items-center gap-1.5 text-xs font-medium capitalize px-2 py-0.5 rounded-full',
                    getDoctorStatus(selectedDoctor) === 'online' ? 'bg-green-100 text-green-700' :
                    getDoctorStatus(selectedDoctor) === 'blocked' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  )}>
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      getDoctorStatus(selectedDoctor) === 'online' ? 'bg-green-500' :
                      getDoctorStatus(selectedDoctor) === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                    )} />
                    {getDoctorStatus(selectedDoctor)}
                  </span>
                } />
                <InfoItem label="Fee Online" value={`₹${selectedDoctor.feeOnline || 0}`} />
                <InfoItem label="Fee At Home" value={`₹${selectedDoctor.feeAtHome || 0}`} />
                <InfoItem label="Commission" value={`${selectedDoctor.commissionRate || 15}%`} />
              </div>

              {/* Tabs */}
              <Tabs defaultValue="bookings" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="bookings" className="flex-1 gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5" /> Bookings
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="flex-1 gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Prescriptions
                  </TabsTrigger>
                  <TabsTrigger value="revenue" className="flex-1 gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" /> Revenue
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bookings" className="mt-4">
                  {viewLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                  ) : doctorBookings.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto rounded-lg border" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                            <TableHead className="text-xs font-semibold uppercase text-gray-500">UHID</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-gray-500">Patient</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-gray-500">Date</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {doctorBookings.map((b) => (
                            <TableRow key={b.id} className="hover:bg-gray-50/50">
                              <TableCell className="font-mono text-xs text-blue-700 font-medium">{b.patientUhid || '—'}</TableCell>
                              <TableCell className="text-sm text-gray-900">{b.patientName}</TableCell>
                              <TableCell className="text-sm text-gray-600">{b.date}</TableCell>
                              <TableCell>
                                <Badge variant="secondary" className={cn('text-[11px] capitalize', bookingStatusColor[b.status] || 'bg-gray-100 text-gray-800')}>
                                  {b.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 text-sm py-6">No bookings found for this doctor</p>
                  )}
                </TabsContent>

                <TabsContent value="prescriptions" className="mt-4">
                  {viewLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : doctorPrescriptions.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                      {doctorPrescriptions.map((p) => (
                        <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.patientName}</p>
                            {p.diagnosis && <p className="text-xs text-gray-500 truncate">{p.diagnosis}</p>}
                          </div>
                          <p className="text-xs text-gray-400 flex-shrink-0">{p.date}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 text-sm py-6">No prescriptions found for this doctor</p>
                  )}
                </TabsContent>

                <TabsContent value="revenue" className="mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">Total Bookings</p>
                      <p className="text-2xl font-bold text-blue-700">{doctorBookings.length}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">Total Earnings</p>
                      <p className="text-2xl font-bold text-blue-700">₹{(selectedDoctor.totalEarnings || 0).toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">Commission ({selectedDoctor.commissionRate || 15}%)</p>
                      <p className="text-2xl font-bold text-blue-700">₹{selectedDoctor.commissionDue || 0}</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Completed Bookings</span>
                      <span className="font-medium text-gray-900">{completedBookings}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-500">Commission Due</span>
                      <span className="font-medium text-blue-700">₹{selectedDoctor.commissionDue || 0}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Block/Unblock AlertDialog */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedDoctor?.isBlocked ? 'Unblock Doctor' : 'Block Doctor'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDoctor?.isBlocked
                ? `Are you sure you want to unblock ${selectedDoctor?.name}? They will regain access to their portal and can accept new bookings.`
                : `Are you sure you want to block ${selectedDoctor?.name}? They will lose access to their portal and won't be able to accept new bookings. This action can be reversed later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockToggle}
              disabled={blocking}
              className={selectedDoctor?.isBlocked
                ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600'
                : 'bg-red-600 hover:bg-red-700 focus:ring-red-600'
              }
            >
              {blocking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedDoctor?.isBlocked ? 'Unblock' : 'Block'} Doctor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Small helper component for doctor info display
function InfoItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase font-medium text-gray-400">{label}</p>
      <div className="text-sm text-gray-900 truncate">{value || '—'}</div>
    </div>
  )
}