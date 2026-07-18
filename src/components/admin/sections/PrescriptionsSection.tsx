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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Search, Eye, FileText, Pill, ClipboardList, Calendar,
  User, Stethoscope, RefreshCw,
} from 'lucide-react'

interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface Prescription {
  id: string
  patientUhid: string
  patientName: string
  doctorName: string
  doctorId?: string
  diagnosis: string
  medications: string | Medication[]
  notes?: string
  status?: string
  createdAt: string
}

const statusColor: Record<string, string> = {
  sent: 'bg-green-100 text-green-800',
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
}

export function PrescriptionsSection() {
  const { toast } = useToast()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [doctorFilter, setDoctorFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  const fetchPrescriptions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      const res = await fetch(`/api/prescriptions?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setPrescriptions(Array.isArray(data) ? data : data.prescriptions || [])
      } else {
        toast({ title: 'Error', description: 'Failed to fetch prescriptions', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => {
    fetchPrescriptions()
  }, [fetchPrescriptions])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const clearFilters = () => {
    setSearchInput('')
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setDoctorFilter('all')
    setStatusFilter('all')
  }

  const hasActiveFilters = search || dateFrom || dateTo || doctorFilter !== 'all' || statusFilter !== 'all'

  // Unique doctors for filter dropdown
  const uniqueDoctors = Array.from(new Set(prescriptions.map(p => p.doctorName).filter(Boolean))).sort()

  // Client-side filters
  const filtered = prescriptions.filter((p) => {
    if (doctorFilter !== 'all' && p.doctorName !== doctorFilter) return false
    if (statusFilter !== 'all') {
      const s = (p.status || 'sent').toLowerCase()
      if (s !== statusFilter) return false
    }
    if (dateFrom && p.createdAt < dateFrom) return false
    if (dateTo && p.createdAt > dateTo) return false
    return true
  })

  const parseMedications = (meds: string | Medication[]): Medication[] => {
    if (Array.isArray(meds)) return meds
    try {
      const parsed = JSON.parse(meds)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  const handleView = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Prescription Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage all prescriptions across doctors</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 text-gray-600 hover:text-gray-800 border-gray-200"
          onClick={() => fetchPrescriptions()}
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Table Card */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-4 space-y-4">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by patient, doctor, or UHID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 h-10 text-sm w-full"
            />
          </form>

          {/* Filter Row: Date Range + 2 Dropdowns */}
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
            <div className="pb-1.5">
              <span className="text-xs text-gray-400">to</span>
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
              <label className="text-[11px] uppercase font-semibold text-gray-400">Doctor</label>
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="h-9 text-sm w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {uniqueDoctors.map((d) => (
                    <SelectItem key={d} value={d!}>{d}</SelectItem>
                  ))}
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
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
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
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 w-10">#</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Patient Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">UHID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Doctor</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Diagnosis</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Medicines</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Sent At</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filtered.length > 0 ? (
                  filtered.map((p, idx) => {
                    const medCount = parseMedications(p.medications).length
                    return (
                      <TableRow
                        key={p.id}
                        className="hover:bg-gray-50/50 cursor-pointer"
                        onClick={() => handleView(p)}
                      >
                        <TableCell className="text-xs text-gray-500">{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{p.patientName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-blue-600 font-medium">{p.patientUhid}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                              <Stethoscope className="w-3 h-3" />
                            </div>
                            <span className="text-sm text-gray-700">{p.doctorName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 max-w-[180px] truncate">{p.diagnosis}</TableCell>
                        <TableCell>
                          <span className="text-sm text-blue-600 font-medium">{medCount} medicine{medCount !== 1 ? 's' : ''}</span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{formatDate(p.createdAt)}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={cn(
                              'text-[11px] capitalize',
                              statusColor[(p.status || 'sent').toLowerCase()] || 'bg-gray-100 text-gray-800'
                            )}
                          >
                            {p.status || 'Sent'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-400 text-sm">
                      {hasActiveFilters ? 'No prescriptions found matching your filters' : 'No prescriptions found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Prescription Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Prescription Details
            </DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-5">
              {/* Patient & Doctor Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase font-semibold">Patient UHID</Label>
                  <p className="text-sm font-mono text-blue-700 font-medium">{selectedPrescription.patientUhid}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase font-semibold">Patient Name</Label>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    {selectedPrescription.patientName}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase font-semibold">Doctor</Label>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-gray-400" />
                    {selectedPrescription.doctorName}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase font-semibold">Date</Label>
                  <p className="text-sm text-gray-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    {formatDate(selectedPrescription.createdAt)}
                  </p>
                </div>
              </div>

              {/* Diagnosis */}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 uppercase font-semibold">Diagnosis</Label>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">{selectedPrescription.diagnosis}</p>
              </div>

              {/* Medications Table */}
              <div className="space-y-2">
                <Label className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5" />
                  Medications
                </Label>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="text-xs font-semibold text-gray-500">Medicine Name</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500">Dosage</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500">Frequency</TableHead>
                        <TableHead className="text-xs font-semibold text-gray-500">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseMedications(selectedPrescription.medications).length > 0 ? (
                        parseMedications(selectedPrescription.medications).map((med, idx) => (
                          <TableRow key={idx} className="hover:bg-gray-50/50">
                            <TableCell className="text-sm font-medium text-gray-900">{med.name}</TableCell>
                            <TableCell className="text-sm text-gray-600">{med.dosage}</TableCell>
                            <TableCell className="text-sm text-gray-600">{med.frequency}</TableCell>
                            <TableCell className="text-sm text-gray-600">{med.duration}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-gray-400 text-sm">
                            No medications listed
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Notes
                  </Label>
                  <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-100">
                    {selectedPrescription.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}