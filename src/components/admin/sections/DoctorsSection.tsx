'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Plus, Search, Eye, Ban, CheckCircle, Loader2, Stethoscope, FileText, DollarSign } from 'lucide-react'

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
  status: string
  isVerified: boolean
  isBlocked: boolean
  hasPortalAccess: boolean
  bookingsCount: number
  commissionDue: number
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
  prescriptionId?: string
  patientName: string
  date: string
  diagnosis?: string
}

const statusColor: Record<string, string> = {
  online: 'bg-blue-100 text-blue-700',
  offline: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
}

const bookingStatusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

const specialtyOptions = [
  'Gynaecologist',
  'Pediatrician',
  'Geriatric Specialist',
  'General Physician',
  'Internal Medicine',
  'Family Doctor',
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

  // Fetch doctors
  useEffect(() => {
    fetchDoctors()
  }, [search, statusFilter, verifiedFilter])

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (verifiedFilter !== 'all') params.set('verified', verifiedFilter)

      const res = await fetch(`/api/doctors?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setDoctors(Array.isArray(data) ? data : data.doctors || [])
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch doctors', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
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
    try {
      const [bookingsRes, prescriptionsRes] = await Promise.all([
        fetch(`/api/bookings?doctorId=${doctor.id}`),
        fetch(`/api/prescriptions?doctorId=${doctor.id}`),
      ])
      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        setDoctorBookings(Array.isArray(data) ? data : data.bookings || [])
      }
      if (prescriptionsRes.ok) {
        const data = await prescriptionsRes.json()
        setDoctorPrescriptions(Array.isArray(data) ? data : data.prescriptions || [])
      }
    } catch {
      // Silently fail – data will just be empty
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
  }

  // Revenue calculations
  const totalEarnings = doctorBookings.length * (selectedDoctor?.feeOnline || 0)
  const totalCommission = Math.round(totalEarnings * ((selectedDoctor?.commissionRate || 15) / 100))
  const completedBookings = doctorBookings.filter(b => b.status === 'completed').length

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Filters Row */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, specialty or area..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Verified" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">Doctors</CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Doctor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input placeholder="Dr. Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" placeholder="doctor@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input type="password" placeholder="Set password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Specialty *</Label>
                    <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                      <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                      <SelectContent>
                        {specialtyOptions.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Experience (years)</Label>
                    <Input type="number" placeholder="e.g. 5" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Qualifications</Label>
                  <Input placeholder="MBBS, MD, etc." value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Area</Label>
                  <Input placeholder="City or locality" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Fee Online (₹)</Label>
                    <Input type="number" placeholder="500" value={form.feeOnline} onChange={(e) => setForm({ ...form, feeOnline: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fee At Home (₹)</Label>
                    <Input type="number" placeholder="800" value={form.feeAtHome} onChange={(e) => setForm({ ...form, feeAtHome: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Commission Rate (%)</Label>
                    <Input type="number" placeholder="15" value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Doctor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Specialty</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Area</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Portal</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Bookings</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Commission Due</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : doctors.length > 0 ? (
                  doctors.map((d) => (
                    <TableRow key={d.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{d.name}</p>
                            {d.isVerified && (
                              <p className="text-[10px] text-blue-600 flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3" /> Verified
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">{d.specialty}</TableCell>
                      <TableCell className="text-sm text-gray-600">{d.area || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px] capitalize', statusColor[d.status] || 'bg-gray-100 text-gray-800')}>
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {d.hasPortalAccess ? (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[11px]">Yes</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[11px]">No</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 font-medium">{d.bookingsCount || 0}</TableCell>
                      <TableCell className="text-sm text-gray-700 font-medium">₹{d.commissionDue || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => handleViewDoctor(d)}
                          >
                            <Eye className="w-3 h-3 mr-1" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              'text-xs hover:bg-gray-50',
                              d.isBlocked
                                ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
                                : 'border-red-200 text-red-600 hover:bg-red-50'
                            )}
                            onClick={() => openBlockDialog(d)}
                          >
                            {d.isBlocked ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Ban className="w-3 h-3 mr-1" />
                            )}
                            {d.isBlocked ? 'Unblock' : 'Block'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400 text-sm">
                      No doctors found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
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
                  <Badge variant="secondary" className={cn('text-[11px] capitalize', statusColor[selectedDoctor.status] || 'bg-gray-100 text-gray-800')}>
                    {selectedDoctor.status}
                  </Badge>
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
                      <p className="text-2xl font-bold text-blue-700">₹{totalEarnings.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">Commission ({selectedDoctor.commissionRate || 15}%)</p>
                      <p className="text-2xl font-bold text-blue-700">₹{totalCommission.toLocaleString()}</p>
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