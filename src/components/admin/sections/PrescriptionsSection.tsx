'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Search, Eye, FileText, Pill, ClipboardList, Calendar, User, Stethoscope, AlertCircle } from 'lucide-react'

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
  diagnosis: string
  medications: string | Medication[]
  notes?: string
  createdAt: string
}

export function PrescriptionsSection() {
  const { toast } = useToast()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async (query?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
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
  }

  const handleSearch = () => {
    fetchPrescriptions(search)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const parseMedications = (meds: string | Medication[]): Medication[] => {
    if (Array.isArray(meds)) return meds
    try {
      const parsed = JSON.parse(meds)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const getMedicationPreview = (meds: string | Medication[]): string => {
    const list = parseMedications(meds)
    if (list.length === 0) return '-'
    if (list.length <= 2) return list.map(m => m.name).join(', ')
    return `${list[0].name}, ${list[1].name}...`
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
      {/* Prescriptions Table */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Prescriptions
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by patient, UHID, or doctor..."
                className="pl-9 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-9"
              onClick={handleSearch}
            >
              <Search className="w-3.5 h-3.5" /> Search
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Patient UHID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Patient Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Doctor</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Diagnosis</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Medications</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : prescriptions.length > 0 ? (
                  prescriptions.map((p) => (
                    <TableRow key={p.id} className="hover:bg-gray-50/50">
                      <TableCell className="font-mono text-xs text-emerald-700 font-medium">{p.patientUhid}</TableCell>
                      <TableCell className="text-sm font-medium text-gray-900">{p.patientName}</TableCell>
                      <TableCell className="text-sm text-gray-700">{p.doctorName}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[160px] truncate">{p.diagnosis}</TableCell>
                      <TableCell className="text-sm text-gray-600 max-w-[180px] truncate">{getMedicationPreview(p.medications)}</TableCell>
                      <TableCell className="text-sm text-gray-600">{formatDate(p.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleView(p)}
                        >
                          <Eye className="w-3 h-3 mr-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                      No prescriptions found
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
              <FileText className="w-5 h-5 text-emerald-600" />
              Prescription Details
            </DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-5">
              {/* Patient & Doctor Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500 uppercase font-semibold">Patient UHID</Label>
                  <p className="text-sm font-mono text-emerald-700 font-medium">{selectedPrescription.patientUhid}</p>
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
                  <p className="text-sm text-gray-700 bg-emerald-50 rounded-lg p-3 border border-emerald-100">
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