'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
  DollarSign, Wifi, WifiOff, ShieldOff, Monitor, MoreVertical, X,
  Pencil, Save, CalendarDays, Clock, Languages, MapPin, Award, Phone, Mail,
  TrendingUp, Users, Globe, Home, BarChart3, IndianRupee,
} from 'lucide-react'

/* ─── Types ─── */
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

interface DoctorDetail extends Doctor {
  bio?: string | null
  blockReason?: string | null
  languages?: string | null
  totalRevenue?: number
  totalCommissionPaid?: number
}

interface Booking {
  id: string
  bookingId: string
  patientName: string
  patientUhid?: string
  date: string
  startTime?: string
  status: string
  serviceName?: string
  consultationMode?: string
  source?: string
  totalAmount?: number
  commissionAmount?: number
  doctorEarnings?: number
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
  name: '', email: '', phone: '', password: '', specialty: '',
  qualifications: '', experience: '', area: '',
  feeOnline: '', feeAtHome: '', commissionRate: '15',
}

/* ─── Toggle Switch Component ─── */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        checked ? 'bg-blue-600' : 'bg-gray-300',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

/* ─── Main Component ─── */
export function DoctorsSection() {
  const { toast } = useToast()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [specFilter, setSpecFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')

  // Add doctor
  const [addOpen, setAddOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)

  // View doctor (large dialog)
  const [viewOpen, setViewOpen] = useState(false)
  const [docLoading, setDocLoading] = useState(false)
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null)
  const [doctorBookings, setDoctorBookings] = useState<Booking[]>([])
  const [doctorPrescriptions, setDoctorPrescriptions] = useState<Prescription[]>([])
  const [bookingsTabLoading, setBookingsTabLoading] = useState(false)

  // Edit commission inline
  const [editingCommission, setEditingCommission] = useState(false)
  const [commissionValue, setCommissionValue] = useState('')
  const [savingCommission, setSavingCommission] = useState(false)

  // Block dialog
  const [blockOpen, setBlockOpen] = useState(false)
  const [blocking, setBlocking] = useState(false)

  // 3-dot menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Toggle handlers
  const toggleOnline = useCallback(async (val: boolean) => {
    if (!doctor) return
    try {
      const res = await fetch(`/api/doctors/${doctor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isOnline: val }) })
      if (res.ok) { setDoctor({ ...doctor, isOnline: val }); fetchDoctors() }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
  }, [doctor, toast])

  const toggleBlocked = useCallback(async (val: boolean) => {
    if (!doctor) return
    setDocLoading(true)
    try {
      const res = await fetch(`/api/doctors/${doctor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isBlocked: val }) })
      if (res.ok) { setDoctor({ ...doctor, isBlocked: val }); fetchDoctors() }
      else toast({ title: 'Error', variant: 'destructive' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setDocLoading(false) }
  }, [doctor, toast])

  const toggleVerified = useCallback(async (val: boolean) => {
    if (!doctor) return
    try {
      const res = await fetch(`/api/doctors/${doctor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ verified: val }) })
      if (res.ok) { setDoctor({ ...doctor, verified: val }); fetchDoctors() }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
  }, [doctor, toast])

  // Close menu on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => { fetchDoctors() }, [search, statusFilter, specFilter, verifiedFilter])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (specFilter !== 'all') params.set('specialization', specFilter)
      if (verifiedFilter !== 'all') params.set('verified', verifiedFilter)
      const res = await fetch(`/api/doctors?${params.toString()}`)
      if (res.ok) { const data = await res.json(); setDoctors(Array.isArray(data) ? data : data.data || []) }
    } catch { toast({ title: 'Error', description: 'Failed to fetch doctors', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const getDoctorStatus = (d: Doctor): string => {
    if (d.isBlocked) return 'blocked'
    if (d.isOnline) return 'online'
    return 'offline'
  }

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password || !form.specialty) {
      toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' }); return
    }
    setCreating(true)
    try {
      const payload = { ...form, experience: Number(form.experience) || 0, feeOnline: Number(form.feeOnline) || 0, feeAtHome: Number(form.feeAtHome) || 0, commissionRate: Number(form.commissionRate) || 15 }
      const res = await fetch('/api/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) { toast({ title: 'Doctor Added', description: `${form.name} added successfully` }); setAddOpen(false); setForm(emptyForm); fetchDoctors() }
      else { const data = await res.json(); toast({ title: 'Error', description: data.error || 'Failed', variant: 'destructive' }) }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setCreating(false) }
  }

  // Open doctor detail dialog
  const handleViewDoctor = async (doc: Doctor) => {
    setSelectedDoctorForBlock(doc)
    setViewOpen(true)
    setDocLoading(true)
    setEditingCommission(false)
    setOpenMenuId(null)
    try {
      const [docRes, bookingsRes, prescriptionsRes] = await Promise.all([
        fetch(`/api/doctors/${doc.id}`),
        fetch(`/api/bookings?doctorId=${doc.id}`),
        fetch(`/api/prescriptions?doctorId=${doc.id}`),
      ])
      if (docRes.ok) {
        const d = await docRes.json()
        setDoctor(d)
        setCommissionValue(String(d.commissionRate))
      }
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setDoctorBookings(Array.isArray(data) ? data : data.data || [])
      }
      if (prescriptionsRes.ok) {
        const data = await prescriptionsRes.json()
        setDoctorPrescriptions(Array.isArray(data) ? data : data.data || [])
      }
    } catch { /* silent */ }
    finally { setDocLoading(false) }
  }

  const saveCommission = async () => {
    if (!doctor) return
    setSavingCommission(true)
    try {
      const res = await fetch(`/api/doctors/${doctor.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commissionRate: Number(commissionValue) }) })
      if (res.ok) {
        setDoctor({ ...doctor, commissionRate: Number(commissionValue) })
        setEditingCommission(false)
        fetchDoctors()
        toast({ title: 'Updated', description: 'Commission rate updated' })
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setSavingCommission(false) }
  }

  // Block/unblock via alert dialog
  const [selectedDoctorForBlock, setSelectedDoctorForBlock] = useState<Doctor | null>(null)
  const openBlockDialog = (doc: Doctor) => { setSelectedDoctorForBlock(doc); setBlockOpen(true); setOpenMenuId(null) }
  const handleBlockToggle = async () => {
    if (!selectedDoctorForBlock) return
    setBlocking(true)
    try {
      const isBlocked = !selectedDoctorForBlock.isBlocked
      const res = await fetch(`/api/doctors/${selectedDoctorForBlock.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isBlocked }) })
      if (res.ok) {
        toast({ title: isBlocked ? 'Blocked' : 'Unblocked', description: `${selectedDoctorForBlock.name} ${isBlocked ? 'blocked' : 'unblocked'}` })
        setBlockOpen(false); setViewOpen(false); fetchDoctors()
      } else toast({ title: 'Error', variant: 'destructive' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setBlocking(false) }
  }

  // Parsed languages
  const parsedLanguages = doctor?.languages ? (typeof doctor.languages === 'string' ? JSON.parse(doctor.languages) : doctor.languages) : []

  // Stats
  const onlineCount = doctors.filter(d => d.isOnline && !d.isBlocked).length
  const offlineCount = doctors.filter(d => !d.isOnline && !d.isBlocked).length
  const blockedCount = doctors.filter(d => d.isBlocked).length
  const portalCount = doctors.filter(d => d.isPortalUser).length

  const statCards = [
    { label: 'Total Doctors', value: doctors.length, icon: Stethoscope, color: 'bg-blue-50', iconColor: 'text-blue-600', valueColor: 'text-blue-700' },
    { label: 'Online', value: onlineCount, icon: Wifi, color: 'bg-green-50', iconColor: 'text-green-500', valueColor: 'text-green-700' },
    { label: 'Offline', value: offlineCount, icon: WifiOff, color: 'bg-gray-50', iconColor: 'text-gray-400', valueColor: 'text-gray-700' },
    { label: 'Blocked', value: blockedCount, icon: ShieldOff, color: 'bg-red-50', iconColor: 'text-red-500', valueColor: 'text-red-700' },
    { label: 'Using Portal', value: portalCount, icon: Monitor, color: 'bg-purple-50', iconColor: 'text-purple-500', valueColor: 'text-purple-700' },
  ]

  const completedBookings = doctorBookings.filter(b => b.status === 'completed').length

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder="Search doctors by name, email, or phone..." className="pl-9 h-9 rounded-lg border-gray-200 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px] h-9 rounded-lg border-gray-200 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
        <Select value={specFilter} onValueChange={setSpecFilter}>
          <SelectTrigger className="w-full sm:w-[170px] h-9 rounded-lg border-gray-200 text-sm"><SelectValue placeholder="All Specializations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specializations</SelectItem>
            {specialtyOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
          <SelectTrigger className="w-full sm:w-[100px] h-9 rounded-lg border-gray-200 text-sm"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Verified</SelectItem>
            <SelectItem value="false">Unverified</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
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
              <DialogHeader><DialogTitle>Add New Doctor</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label className="text-xs font-medium">Name *</Label><Input placeholder="Dr. Full Name" className="h-9 text-sm rounded-lg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="space-y-2"><Label className="text-xs font-medium">Email *</Label><Input type="email" placeholder="doctor@example.com" className="h-9 text-sm rounded-lg" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2"><Label className="text-xs font-medium">Phone</Label><Input placeholder="+91 98765 43210" className="h-9 text-sm rounded-lg" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                  <div className="space-y-2"><Label className="text-xs font-medium">Password *</Label><Input type="password" placeholder="Set password" className="h-9 text-sm rounded-lg" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">Specialty *</Label>
                    <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                      <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{specialtyOptions.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label className="text-xs font-medium">Experience (yrs)</Label><Input type="number" placeholder="e.g. 5" className="h-9 text-sm rounded-lg" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></div>
                </div>
                <div className="space-y-2"><Label className="text-xs font-medium">Qualifications</Label><Input placeholder="MBBS, MD" className="h-9 text-sm rounded-lg" value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} /></div>
                <div className="space-y-2"><Label className="text-xs font-medium">Area</Label><Input placeholder="City or locality" className="h-9 text-sm rounded-lg" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2"><Label className="text-xs font-medium">Fee Online</Label><Input type="number" placeholder="500" className="h-9 text-sm rounded-lg" value={form.feeOnline} onChange={(e) => setForm({ ...form, feeOnline: e.target.value })} /></div>
                  <div className="space-y-2"><Label className="text-xs font-medium">Fee At Home</Label><Input type="number" placeholder="800" className="h-9 text-sm rounded-lg" value={form.feeAtHome} onChange={(e) => setForm({ ...form, feeAtHome: e.target.value })} /></div>
                  <div className="space-y-2"><Label className="text-xs font-medium">Commission %</Label><Input type="number" placeholder="15" className="h-9 text-sm rounded-lg" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} /></div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)} className="rounded-lg">Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg" onClick={handleCreate} disabled={creating}>{creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add Doctor</Button>
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
                  <TableRow key={i} className="border-0">{Array.from({ length: 9 }).map((_, j) => (<TableCell key={j} className={j === 0 ? 'pl-5' : j === 8 ? 'pr-5' : ''}><Skeleton className="h-4 w-20" /></TableCell>))}</TableRow>
                ))
              ) : doctors.length > 0 ? (
                doctors.map((d) => {
                  const status = getDoctorStatus(d)
                  return (
                    <TableRow key={d.id} className="hover:bg-gray-50/50 border-0 border-b border-gray-100 last:border-0 cursor-pointer" onClick={() => handleViewDoctor(d)}>
                      <TableCell className="pl-5 py-3">
                        <p className="text-sm font-semibold text-gray-900">{d.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{d.specialty}</p>
                      </TableCell>
                      <TableCell className="py-3"><p className="text-sm text-gray-700">{d.phone}</p></TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn('w-2 h-2 rounded-full', status === 'online' ? 'bg-green-500' : status === 'blocked' ? 'bg-red-500' : 'bg-gray-400')} />
                          <span className={cn('text-xs font-medium capitalize', status === 'online' ? 'text-green-700' : status === 'blocked' ? 'text-red-700' : 'text-gray-600')}>{status}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">{d.feeOnline > 0 ? `₹${d.feeOnline.toLocaleString()}` : '₹0'}</span>
                          <span className="text-gray-400 mx-0.5">/</span>
                          <span>{d.feeAtHome > 0 ? `₹${d.feeAtHome.toLocaleString()}` : '₹0'}</span>
                        </p>
                      </TableCell>
                      <TableCell className="py-3"><p className="text-sm font-medium text-gray-700">{d.commissionRate}%</p></TableCell>
                      <TableCell className="py-3"><p className="text-sm text-gray-700">{d.bookingCount || 0}</p></TableCell>
                      <TableCell className="py-3"><p className="text-sm font-medium text-gray-900">{d.totalEarnings > 0 ? `₹${d.totalEarnings.toLocaleString()}` : '₹0'}</p></TableCell>
                      <TableCell className="py-3">
                        {d.verified ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span className="w-4 h-4 rounded-full border-2 border-gray-300 inline-block" />}
                      </TableCell>
                      <TableCell className="py-3 pr-5">
                        <div className="relative">
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-lg hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === d.id ? null : d.id) }}>
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </Button>
                          {openMenuId === d.id && (
                            <div ref={menuRef} className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleViewDoctor(d) }}>
                                <Eye className="w-3.5 h-3.5 text-gray-400" /> View Details
                              </button>
                              <button className={cn('w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center gap-2', d.isBlocked ? 'text-green-600' : 'text-red-600')} onClick={(e) => { e.stopPropagation(); openBlockDialog(d) }}>
                                {d.isBlocked ? <><CheckCircle className="w-3.5 h-3.5" /> Unblock</> : <><Ban className="w-3.5 h-3.5" /> Block</>}
                              </button>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow className="border-0"><TableCell colSpan={9} className="text-center py-12 text-gray-400 text-sm">No doctors found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════
          DOCTOR DETAIL DIALOG — Large Profile Management View
         ═══════════════════════════════════════════════════════════ */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-hidden p-0 flex flex-col">
          <DialogTitle className="sr-only">Doctor Details</DialogTitle>
          {docLoading && !doctor ? (
            <div className="flex-1 flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
          ) : doctor ? (
            <>
              {/* ── Header ── */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Doctor Details</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Full profile and management controls</p>
                  </div>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full hover:bg-gray-100" onClick={() => setViewOpen(false)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </div>

              {/* ── Scrollable Content ── */}
              <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                <div className="px-6 py-5 space-y-6">

                  {/* ── Profile Summary ── */}
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-blue-700">{doctor.name.split(' ').map(n => n[0]).join('').slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
                      <p className="text-sm text-gray-500">{doctor.specialty}{doctor.qualifications ? ` · ${doctor.qualifications}` : ''}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{doctor.phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{doctor.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Status Toggles ── */}
                  <div className="flex items-center gap-8 bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Wifi className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 w-16">Online</span>
                      <Toggle checked={doctor.isOnline} onChange={toggleOnline} disabled={doctor.isBlocked} />
                    </div>
                    <div className="flex items-center gap-3">
                      <ShieldOff className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 w-16">Blocked</span>
                      <Toggle checked={doctor.isBlocked} onChange={toggleBlocked} />
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600 w-16">Verified</span>
                      <Toggle checked={doctor.verified} onChange={toggleVerified} />
                    </div>
                  </div>

                  {/* ── 2x2 Info Cards Grid ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    {/* Commission Rate */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-600">Commission Rate</h4>
                        {editingCommission ? (
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-500 hover:text-gray-700 px-2" onClick={() => { setEditingCommission(false); setCommissionValue(String(doctor.commissionRate)) }}>
                              <X className="w-3 h-3" />
                            </Button>
                            <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 gap-1" onClick={saveCommission} disabled={savingCommission}>
                              {savingCommission ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Save
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-xs border-gray-300 text-gray-600 hover:bg-white px-2 gap-1" onClick={() => setEditingCommission(true)}>
                            <Pencil className="w-3 h-3" /> Edit
                          </Button>
                        )}
                      </div>
                      {editingCommission ? (
                        <div className="flex items-center gap-2">
                          <Input type="number" value={commissionValue} onChange={(e) => setCommissionValue(e.target.value)} className="h-10 w-24 text-center text-lg font-bold rounded-lg border-gray-300" />
                          <span className="text-lg text-gray-400">%</span>
                        </div>
                      ) : (
                        <p className="text-3xl font-bold text-blue-600">{doctor.commissionRate}%</p>
                      )}
                    </div>

                    {/* Earnings & Due */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">Earnings & Due</h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Total Earnings</span>
                          <span className="text-sm font-semibold text-gray-900">₹{(doctor.totalEarnings || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Platform Fee Paid</span>
                          <span className="text-sm font-semibold text-green-600">₹{(doctor.totalCommissionPaid || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Platform Fee Due</span>
                          <span className="text-sm font-semibold text-red-600">₹{(doctor.commissionDue || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Consultation Fees */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">Consultation Fees</h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Online Fee</span>
                          <span className="text-sm font-semibold text-gray-900">₹{(doctor.feeOnline || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Home Visit Fee</span>
                          <span className="text-sm font-semibold text-gray-900">₹{(doctor.feeAtHome || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Availability & Info */}
                    <div className="bg-gray-50 rounded-xl p-5">
                      <h4 className="text-sm font-semibold text-gray-600 mb-3">Availability</h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Experience</span>
                          <span className="text-sm font-semibold text-gray-900">{doctor.experience || 0} yrs</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />Area</span>
                          <span className="text-sm font-semibold text-gray-900">{doctor.area || 'N/A'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" />Languages</span>
                          <span className="text-sm font-semibold text-gray-900">{parsedLanguages.length > 0 ? parsedLanguages.join(', ') : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── Tabs: Bookings, Prescriptions & Analytics ── */}
                  <Tabs defaultValue="bookings" className="w-full">
                    <TabsList className="w-full">
                      <TabsTrigger value="bookings" className="flex-1 gap-1.5 text-sm"><CalendarDays className="w-3.5 h-3.5" /> Bookings ({doctorBookings.length})</TabsTrigger>
                      <TabsTrigger value="prescriptions" className="flex-1 gap-1.5 text-sm"><FileText className="w-3.5 h-3.5" /> Prescriptions ({doctorPrescriptions.length})</TabsTrigger>
                      <TabsTrigger value="analytics" className="flex-1 gap-1.5 text-sm"><BarChart3 className="w-3.5 h-3.5" /> Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="bookings" className="mt-4">
                      <div className="max-h-[280px] overflow-y-auto rounded-lg border border-gray-200" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                              <TableHead className="text-xs font-semibold uppercase text-gray-500">Booking ID</TableHead>
                              <TableHead className="text-xs font-semibold uppercase text-gray-500">Patient</TableHead>
                              <TableHead className="text-xs font-semibold uppercase text-gray-500">Date</TableHead>
                              <TableHead className="text-xs font-semibold uppercase text-gray-500">Service</TableHead>
                              <TableHead className="text-xs font-semibold uppercase text-gray-500">Amount</TableHead>
                              <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {doctorBookings.length > 0 ? doctorBookings.map((b) => (
                              <TableRow key={b.id} className="hover:bg-gray-50/50">
                                <TableCell className="font-mono text-xs text-blue-700 font-medium">{b.bookingId || '—'}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="text-sm text-gray-900">{b.patientName}</p>
                                    {b.patientUhid && <p className="text-[11px] text-gray-400 font-mono">{b.patientUhid}</p>}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">{b.date}</TableCell>
                                <TableCell className="text-sm text-gray-600">{b.serviceName || '—'}</TableCell>
                                <TableCell className="text-sm font-medium text-gray-900">{b.totalAmount ? `₹${b.totalAmount.toLocaleString()}` : '—'}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className={cn('text-[11px] capitalize', bookingStatusColor[b.status] || 'bg-gray-100 text-gray-800')}>
                                    {b.status.replace('_', ' ')}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            )) : (
                              <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400 text-sm">No bookings found</TableCell></TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {doctorBookings.length > 0 && (
                        <div className="mt-3 flex items-center gap-6 text-xs text-gray-500">
                          <span>Total: <strong className="text-gray-900">{doctorBookings.length}</strong></span>
                          <span>Completed: <strong className="text-green-700">{completedBookings}</strong></span>
                          <span>Earnings: <strong className="text-blue-700">₹{(doctor.totalEarnings || 0).toLocaleString()}</strong></span>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="prescriptions" className="mt-4">
                      {doctorPrescriptions.length > 0 ? (
                        <div className="max-h-[280px] overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
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
                        <p className="text-center text-gray-400 text-sm py-8">No prescriptions found for this doctor</p>
                      )}
                    </TabsContent>

                    {/* ── Analytics Tab ── */}
                    <TabsContent value="analytics" className="mt-4">
                      {(() => {
                        const bk = doctorBookings
                        const total = bk.length
                        const completed = bk.filter(b => b.status === 'completed')
                        const online = bk.filter(b => b.consultationMode === 'online')
                        const offline = bk.filter(b => b.consultationMode === 'in_home')
                        const platform = bk.filter(b => b.source === 'portal' || b.source === 'website')
                        const direct = bk.filter(b => b.source === 'admin')
                        const totalRevenue = completed.reduce((s, b) => s + (b.totalAmount || 0), 0)
                        const platformRevenue = completed.filter(b => b.source === 'portal' || b.source === 'website').reduce((s, b) => s + (b.totalAmount || 0), 0)
                        const totalCommission = completed.reduce((s, b) => s + (b.commissionAmount || 0), 0)
                        const totalEarnings = completed.reduce((s, b) => s + (b.doctorEarnings || 0), 0)

                        // Unique patients
                        const uniquePatients = new Set(bk.map(b => b.patientUhid || b.patientName)).size

                        // Peak hours (from startTime)
                        const hourCounts: Record<string, number> = {}
                        bk.forEach(b => { if (b.startTime) { const h = b.startTime.split(':')[0] + ':00'; hourCounts[h] = (hourCounts[h] || 0) + 1 } })
                        const peakHours = Object.entries(hourCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
                        const maxHourCount = peakHours.length > 0 ? peakHours[0][1] : 1

                        // Peak days (day of week from date)
                        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                        const dayCounts: Record<string, number> = {}
                        bk.forEach(b => { try { const d = new Date(b.date); dayCounts[dayNames[d.getDay()]] = (dayCounts[dayNames[d.getDay()]] || 0) + 1 } catch {} })
                        const peakDays = Object.entries(dayCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
                        const maxDayCount = peakDays.length > 0 ? peakDays[0][1] : 1

                        return (
                          <div className="space-y-4">
                            {/* Row 1: Overview stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="bg-blue-50 rounded-xl p-3.5 text-center">
                                <Users className="w-4 h-4 text-blue-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-gray-900">{uniquePatients}</p>
                                <p className="text-[11px] text-gray-500">Unique Patients</p>
                              </div>
                              <div className="bg-green-50 rounded-xl p-3.5 text-center">
                                <TrendingUp className="w-4 h-4 text-green-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-gray-900">{completed.length}</p>
                                <p className="text-[11px] text-gray-500">Completed</p>
                              </div>
                              <div className="bg-amber-50 rounded-xl p-3.5 text-center">
                                <IndianRupee className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
                                <p className="text-[11px] text-gray-500">Total Revenue</p>
                              </div>
                              <div className="bg-purple-50 rounded-xl p-3.5 text-center">
                                <DollarSign className="w-4 h-4 text-purple-600 mx-auto mb-1" />
                                <p className="text-lg font-bold text-gray-900">₹{totalEarnings.toLocaleString()}</p>
                                <p className="text-[11px] text-gray-500">Doctor Earnings</p>
                              </div>
                            </div>

                            {/* Row 2: Online vs Offline + Platform vs Direct */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Online vs Offline */}
                              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <h5 className="text-xs font-semibold text-gray-500 uppercase">Consultation Mode</h5>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="flex items-center gap-1 text-teal-700"><Globe className="w-3 h-3" /> Online</span>
                                      <span className="font-semibold text-gray-900">{online.length}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                      <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${total > 0 ? (online.length / total * 100) : 0}%` }} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="flex items-center gap-1 text-amber-700"><Home className="w-3 h-3" /> Offline (Home Visit)</span>
                                      <span className="font-semibold text-gray-900">{offline.length}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                      <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${total > 0 ? (offline.length / total * 100) : 0}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Platform vs Direct */}
                              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                <h5 className="text-xs font-semibold text-gray-500 uppercase">Patient Source</h5>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="flex items-center gap-1 text-blue-700"><Globe className="w-3 h-3" /> Platform</span>
                                      <span className="font-semibold text-gray-900">{platform.length}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${total > 0 ? (platform.length / total * 100) : 0}%` }} />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between text-xs mb-1">
                                      <span className="flex items-center gap-1 text-gray-500"><Users className="w-3 h-3" /> Direct / Admin</span>
                                      <span className="font-semibold text-gray-900">{direct.length}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                                      <div className="h-full bg-gray-500 rounded-full transition-all" style={{ width: `${total > 0 ? (direct.length / total * 100) : 0}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Row 3: Revenue Breakdown */}
                            <div className="bg-blue-50 rounded-xl p-4">
                              <h5 className="text-xs font-semibold text-blue-700 uppercase mb-3">Revenue Breakdown</h5>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <p className="text-[11px] text-gray-500">Total Revenue</p>
                                  <p className="text-sm font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] text-gray-500">From Platform</p>
                                  <p className="text-sm font-bold text-blue-700">₹{platformRevenue.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] text-gray-500">Platform Commission</p>
                                  <p className="text-sm font-bold text-red-600">₹{totalCommission.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[11px] text-gray-500">Doctor Earnings</p>
                                  <p className="text-sm font-bold text-green-700">₹{totalEarnings.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>

                            {/* Row 4: Peak Hours & Peak Days */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Peak Hours */}
                              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <h5 className="text-xs font-semibold text-gray-500 uppercase">Peak Hours</h5>
                                {peakHours.length > 0 ? peakHours.map(([hour, count]) => (
                                  <div key={hour} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 w-12 font-mono">{hour}</span>
                                    <div className="flex-1 h-2.5 rounded-full bg-gray-200 overflow-hidden">
                                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(count / maxHourCount) * 100}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                                  </div>
                                )) : <p className="text-xs text-gray-400">No data</p>}
                              </div>

                              {/* Peak Days */}
                              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                                <h5 className="text-xs font-semibold text-gray-500 uppercase">Peak Days</h5>
                                {peakDays.length > 0 ? peakDays.map(([day, count]) => (
                                  <div key={day} className="flex items-center gap-3">
                                    <span className="text-xs text-gray-600 w-24">{day}</span>
                                    <div className="flex-1 h-2.5 rounded-full bg-gray-200 overflow-hidden">
                                      <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${(count / maxDayCount) * 100}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                                  </div>
                                )) : <p className="text-xs text-gray-400">No data</p>}
                              </div>
                            </div>

                            {total === 0 && (
                              <p className="text-center text-gray-400 text-sm py-6">No booking data available for analytics</p>
                            )}
                          </div>
                        )
                      })()}
                    </TabsContent>
                  </Tabs>

                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Block/Unblock AlertDialog */}
      <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selectedDoctorForBlock?.isBlocked ? 'Unblock Doctor' : 'Block Doctor'}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedDoctorForBlock?.isBlocked
                ? `Are you sure you want to unblock ${selectedDoctorForBlock?.name}? They will regain access to their portal and can accept new bookings.`
                : `Are you sure you want to block ${selectedDoctorForBlock?.name}? They will lose access to their portal and won't be able to accept new bookings. This action can be reversed later.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockToggle}
              disabled={blocking}
              className={selectedDoctorForBlock?.isBlocked ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600' : 'bg-red-600 hover:bg-red-700 focus:ring-red-600'}
            >
              {blocking && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {selectedDoctorForBlock?.isBlocked ? 'Unblock' : 'Block'} Doctor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}