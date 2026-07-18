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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Search, Eye, User, CalendarDays, FileText, Phone, Mail, MapPin, X, Loader2 } from 'lucide-react'

interface Patient {
  id: string
  uhid: string
  name: string
  phone: string
  email?: string
  age?: number
  gender?: string
  address?: string
  city?: string
  pincode?: string
  totalBookings?: number
  lastVisit?: string
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
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

export function PatientsSection() {
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
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
        setPatients(Array.isArray(data) ? data : data.patients || [])
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
        const allBookings: Booking[] = Array.isArray(data) ? data : data.bookings || []
        setPatientBookings(allBookings.filter((b: Booking) => b.patientId === patient.id))
      }

      if (prescriptionsRes.ok) {
        const data = await prescriptionsRes.json()
        const allPrescriptions: Prescription[] = Array.isArray(data) ? data : data.prescriptions || []
        setPatientPrescriptions(allPrescriptions.filter((p: Prescription) => p.patientId === patient.id))
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load patient details', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  const totalPatients = patients.length

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold text-gray-900">{totalPatients}</p>}
              <p className="text-xs text-gray-500">Total Patients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-12" /> : (
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.lastVisit).length}
                </p>
              )}
              <p className="text-xs text-gray-500">Active Patients</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-12" /> : (
                <p className="text-2xl font-bold text-gray-900">
                  {patients.reduce((sum, p) => sum + (p.totalBookings || 0), 0)}
                </p>
              )}
              <p className="text-xs text-gray-500">Total Bookings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patients Table */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-semibold text-gray-900">All Patients</CardTitle>
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search UHID, name, phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-9">
              Search
            </Button>
            {search && (
              <Button type="button" variant="ghost" size="sm" className="h-9 text-gray-500 hover:text-gray-700" onClick={clearSearch}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">UHID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Phone</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Age</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Gender</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Bookings</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Last Visit</TableHead>
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
                ) : patients.length > 0 ? (
                  patients.map((p) => (
                    <TableRow key={p.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs text-blue-700 font-medium">{p.uhid}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">{p.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{p.phone}</TableCell>
                      <TableCell className="text-sm text-gray-600">{p.age ?? '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600 capitalize">{p.gender ?? '-'}</TableCell>
                      <TableCell className="text-sm text-gray-600">{p.totalBookings ?? 0}</TableCell>
                      <TableCell className="text-sm text-gray-600">{p.lastVisit ?? '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => handleViewPatient(p)}
                        >
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400 text-sm">
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