'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Search, Eye, User, Users, UserPlus, CalendarDays,
  FileText, Phone, Mail, MapPin, X, Loader2, Activity,
} from 'lucide-react'

interface Patient {
  id: string
  uhid: string
  name: string
  phone: string
  email?: string
  age?: number
  gender?: string
  bloodGroup?: string
  allergies?: string
  address?: string
  city?: string
  pincode?: string
  bookingCount?: number
  lastVisit?: string
  createdAt: string
}

interface Booking {
  id: string
  bookingId: string
  patientId: string
  patientName: string
  patientUhid?: string
  doctorName?: string
  serviceName?: string
  date: string
  status: string
  type?: string
  mode?: string
}

interface Prescription {
  id: string
  patientId: string
  diagnosis?: string
  date: string
  medications?: { name: string; dosage: string; frequency: string }[]
  doctorName?: string
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const bloodGroupColor: Record<string, string> = {
  'A+': 'bg-blue-100 text-blue-800',
  'A-': 'bg-blue-50 text-blue-700',
  'B+': 'bg-blue-100 text-blue-800',
  'B-': 'bg-blue-50 text-blue-700',
  'AB+': 'bg-purple-100 text-purple-800',
  'AB-': 'bg-purple-50 text-purple-700',
  'O+': 'bg-green-100 text-green-800',
  'O-': 'bg-green-50 text-green-700',
}

export function PatientsSection() {
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [patientBookings, setPatientBookings] = useState<Booking[]>([])
  const [patientPrescriptions, setPatientPrescriptions] = useState<Prescription[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchPatients = useCallback(async (query?: string) => {
    try {
      setLoading(true)
      const params = query ? `?search=${encodeURIComponent(query)}` : ''
      const res = await fetch(`/api/patients${params}`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.data || data.patients || []
        setPatients(list)
      } else {
        toast({ title: 'Error', description: 'Failed to fetch patients', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to fetch patients', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    fetchPatients(searchInput)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
    fetchPatients()
  }

  const handleViewPatient = async (patient: Patient) => {
    setSelectedPatient(patient)
    setDetailOpen(true)
    setDetailLoading(true)
    setPatientBookings([])
    setPatientPrescriptions([])

    try {
      const [bookingsRes, prescriptionsRes] = await Promise.all([
        fetch('/api/bookings?page=1&limit=100'),
        fetch('/api/prescriptions'),
      ])

      if (bookingsRes.ok) {
        const data = await bookingsRes.json()
        const allBookings: Booking[] = Array.isArray(data) ? data : data.bookings || data.data || []
        setPatientBookings(allBookings.filter((b: Booking) => b.patientId === patient.id))
      }

      if (prescriptionsRes.ok) {
        const data = await prescriptionsRes.json()
        const allPrescriptions: Prescription[] = Array.isArray(data) ? data : data.data || data.prescriptions || []
        setPatientPrescriptions(allPrescriptions.filter((p: Prescription) => p.patientId === patient.id))
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load patient details', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  // Stat calculations
  const totalPatients = patients.length
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const newThisMonth = patients.filter(p => {
    const d = new Date(p.createdAt)
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
  }).length
  const withActiveBookings = patients.filter(p => (p.bookingCount || 0) > 0).length

  const statCards = [
    { label: 'Total Patients', value: totalPatients, icon: Users, bg: 'bg-blue-100', text: 'text-blue-600' },
    { label: 'New This Month', value: newThisMonth, icon: UserPlus, bg: 'bg-green-100', text: 'text-green-600' },
    { label: 'With Active Bookings', value: withActiveBookings, icon: Activity, bg: 'bg-purple-100', text: 'text-purple-600' },
  ]

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Patient Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">View and manage all patients with their Unique Health ID (UHID)</p>
      </div>

      {/* Stat Cards - 3 in a row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center shrink-0', s.bg, s.text)}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                {loading ? (
                  <Skeleton className="h-6 w-10 mb-1" />
                ) : (
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                )}
                <p className="text-[11px] text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Card */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-4 space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, phone, or UHID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-10 text-sm w-full"
            />
          </form>

          {/* Table */}
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">UHID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Phone</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Gender</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Age</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Blood Group</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Allergies</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Bookings</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Created Date</TableHead>
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
                ) : patients.length > 0 ? (
                  patients.map((p) => (
                    <TableRow key={p.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs text-blue-600 font-medium">{p.uhid}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">{p.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{p.phone}</TableCell>
                      <TableCell className="text-sm text-gray-600 capitalize">{p.gender || '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{p.age ?? '-'}</TableCell>
                      <TableCell>
                        {p.bloodGroup ? (
                          <Badge variant="secondary" className={cn('text-[11px] font-medium', bloodGroupColor[p.bloodGroup] || 'bg-gray-100 text-gray-800')}>
                            {p.bloodGroup}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {p.allergies ? (
                          <Badge variant="secondary" className="text-[11px] bg-red-100 text-red-800">
                            {p.allergies}
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 text-center">{p.bookingCount ?? 0}</TableCell>
                      <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatDate(p.createdAt)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                          onClick={() => handleViewPatient(p)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-400 text-sm">
                      {search ? 'No patients found matching your search' : 'No patients found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Patient Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Patient Details
            </DialogTitle>
          </DialogHeader>

          {selectedPatient && (
            <div className="space-y-6">
              {/* Profile Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">Profile Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase font-semibold text-gray-400">UHID</p>
                    <p className="text-sm font-mono text-blue-700 font-medium">{selectedPatient.uhid}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase font-semibold text-gray-400">Full Name</p>
                    <p className="text-sm text-gray-900">{selectedPatient.name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase font-semibold text-gray-400">Phone</p>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-sm text-gray-700">{selectedPatient.phone}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase font-semibold text-gray-400">Email</p>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-sm text-gray-700">{selectedPatient.email || '-'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase font-semibold text-gray-400">Age</p>
                    <p className="text-sm text-gray-700">{selectedPatient.age ? `${selectedPatient.age} years` : '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase font-semibold text-gray-400">Gender</p>
                    <p className="text-sm text-gray-700 capitalize">{selectedPatient.gender || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase font-semibold text-gray-400">Blood Group</p>
                    {selectedPatient.bloodGroup ? (
                      <Badge variant="secondary" className={cn('text-[11px] font-medium', bloodGroupColor[selectedPatient.bloodGroup] || 'bg-gray-100 text-gray-800')}>
                        {selectedPatient.bloodGroup}
                      </Badge>
                    ) : (
                      <p className="text-sm text-gray-400">-</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] uppercase font-semibold text-gray-400">Allergies</p>
                    {selectedPatient.allergies ? (
                      <Badge variant="secondary" className="text-[11px] bg-red-100 text-red-800">
                        {selectedPatient.allergies}
                      </Badge>
                    ) : (
                      <p className="text-sm text-gray-400">None</p>
                    )}
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-[11px] uppercase font-semibold text-gray-400">Address</p>
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-gray-700">
                        {selectedPatient.address
                          ? `${selectedPatient.address}${selectedPatient.city ? `, ${selectedPatient.city}` : ''}${selectedPatient.pincode ? ` - ${selectedPatient.pincode}` : ''}`
                          : '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs: Bookings | Prescriptions */}
              <Tabs defaultValue="bookings">
                <TabsList>
                  <TabsTrigger value="bookings" className="gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    Bookings
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Prescriptions
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bookings" className="mt-4">
                  {detailLoading ? (
                    <div className="space-y-3 py-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : patientBookings.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto rounded-lg border" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                            <TableHead className="text-xs font-semibold uppercase text-gray-500">Booking ID</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-gray-500">Doctor</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-gray-500">Service</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-gray-500">Date</TableHead>
                            <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {patientBookings.map((b) => (
                            <TableRow key={b.id} className="hover:bg-gray-50/50">
                              <TableCell className="font-mono text-xs text-blue-700 font-medium">{b.bookingId}</TableCell>
                              <TableCell className="text-sm text-gray-700">{b.doctorName || '-'}</TableCell>
                              <TableCell className="text-sm text-gray-700">{b.serviceName || '-'}</TableCell>
                              <TableCell className="text-sm text-gray-600">{b.date}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className={cn('text-[11px] capitalize', statusColor[b.status] || 'bg-gray-100 text-gray-800')}
                                >
                                  {b.status.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <CalendarDays className="w-8 h-8 mb-2" />
                      <p className="text-sm">No bookings found for this patient</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="prescriptions" className="mt-4">
                  {detailLoading ? (
                    <div className="space-y-3 py-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : patientPrescriptions.length > 0 ? (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
                      {patientPrescriptions.map((rx) => (
                        <div key={rx.id} className="border rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{rx.diagnosis || 'No diagnosis recorded'}</p>
                            <span className="text-xs text-gray-400">{rx.date}</span>
                          </div>
                          {rx.doctorName && (
                            <p className="text-xs text-gray-500">Dr. {rx.doctorName}</p>
                          )}
                          {rx.medications && rx.medications.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[11px] uppercase font-semibold text-gray-400 mb-1.5">Medications</p>
                              <div className="flex flex-wrap gap-1.5">
                                {rx.medications.slice(0, 3).map((med, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-[11px] bg-blue-50 text-blue-700">
                                    {med.name} — {med.dosage} {med.frequency}
                                  </Badge>
                                ))}
                                {rx.medications.length > 3 && (
                                  <Badge variant="secondary" className="text-[11px] bg-gray-100 text-gray-600">
                                    +{rx.medications.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <FileText className="w-8 h-8 mb-2" />
                      <p className="text-sm">No prescriptions found for this patient</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}