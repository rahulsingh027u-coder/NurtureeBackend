'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  Plus, Check, X, Star, Loader2, UserCog, Phone, Mail, Award,
  Eye, Upload, FileText, Shield, BarChart3, IndianRupee, CalendarDays, AlertCircle, CheckCircle2,
} from 'lucide-react'

interface Caregiver {
  id: string
  caregiverId: string
  name: string
  phone: string
  email?: string
  specialty: string
  experience: number
  rating?: number
  isAvailable: boolean
  isAadhaarVerified?: boolean
  isPoliceVerified?: boolean
  isMedicalVerified?: boolean
  isVideoVerified?: boolean
  qualifications?: string
}

interface CaregiverDetail {
  caregiver: {
    id: string; caregiverId: string; name: string; phone: string; email: string | null;
    specialty: string; experience: number; qualifications: string | null;
    isAvailable: boolean; isVerified: boolean; rating: number; createdAt: string;
  }
  verificationStatus: { aadhaar: boolean; police: boolean; medical: boolean; video: boolean }
  verificationRecord: {
    id: string; status: string; package: string | null;
    documents: { type: string; url: string; verified: boolean }[];
    reviewNotes: string | null; reviewedAt: string | null; createdAt: string;
  } | null
  pendingVerifications: string[]
  bookings: {
    id: string; bookingId: string; patientName: string; patientUhid: string;
    patientPhone: string; serviceName: string; serviceCategory: string;
    type: string; mode: string; status: string; source: string;
    date: string; startTime: string; endTime: string | null;
    totalAmount: number; commissionAmount: number;
  }[]
  earnings: {
    totalEarnings: number; totalCommission: number; netEarnings: number;
    completedBookings: number; totalBookings: number;
    monthlyEarnings: Record<string, number>;
  }
  analytics: {
    statusBreakdown: Record<string, number>;
    dayBreakdown: Record<string, number>;
    averageRating: number; totalReviews: number;
  }
}

const specialtyBadge: Record<string, string> = {
  child_care: 'bg-pink-100 text-pink-700',
  elder_care: 'bg-orange-100 text-orange-700',
}

const specialtyLabel: Record<string, string> = {
  child_care: 'Child Care',
  elder_care: 'Elder Care',
}

const statusColor: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  pending: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

export function CaregiversSection() {
  const { toast } = useToast()
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CaregiverDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [specialtyFilter, setSpecialtyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')

  const [form, setForm] = useState({
    name: '', phone: '', email: '', specialty: '', experience: '', qualifications: '',
  })

  const fetchCaregivers = useCallback(async (specialty?: string, available?: string, verified?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (specialty && specialty !== 'all') params.set('specialty', specialty)
      if (available && available !== 'all') params.set('available', available === 'available' ? 'true' : 'false')
      if (verified && verified !== 'all') params.set('verified', verified === 'verified' ? 'true' : 'false')
      const res = await fetch(`/api/caregivers?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCaregivers(Array.isArray(data) ? data : data.data || [])
      } else {
        toast({ title: 'Error', description: 'Failed to fetch caregivers', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchCaregivers() }, [fetchCaregivers])

  useEffect(() => {
    fetchCaregivers(specialtyFilter, statusFilter, verifiedFilter)
  }, [specialtyFilter, statusFilter, verifiedFilter, fetchCaregivers])

  const openProfile = async (id: string) => {
    setSelectedId(id)
    setProfileOpen(true)
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await fetch(`/api/caregivers/${id}`)
      if (res.ok) {
        const data = await res.json()
        setDetail(data)
      } else {
        toast({ title: 'Error', description: 'Failed to load caregiver details', variant: 'destructive' })
        setProfileOpen(false)
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
      setProfileOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleUpload = async (fileType: string) => {
    if (!selectedId) return
    setUploading(true)
    try {
      const res = await fetch(`/api/caregivers/${selectedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: fileType }),
      })
      if (res.ok) {
        toast({ title: 'Updated', description: `${fileType} document marked as uploaded` })
        openProfile(selectedId)
      } else {
        toast({ title: 'Error', description: 'Failed to update document', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name || !form.phone || !form.specialty) {
      toast({ title: 'Error', description: 'Please fill required fields (Name, Phone, Specialty)', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/caregivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, experience: form.experience ? Number(form.experience) : 0 }),
      })
      if (res.ok) {
        toast({ title: 'Caregiver Added', description: 'New caregiver has been added successfully' })
        setAddOpen(false)
        setForm({ name: '', phone: '', email: '', specialty: '', experience: '', qualifications: '' })
        fetchCaregivers(specialtyFilter, statusFilter, verifiedFilter)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to add caregiver', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const renderStarRating = (rating?: number) => {
    if (!rating) return <span className="text-gray-400 text-sm">-</span>
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn('w-3.5 h-3.5', i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200')} />
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const VerificationIcon = ({ verified }: { verified: boolean | undefined }) => {
    if (verified) return <Check className="w-4 h-4 text-blue-600" />
    return <X className="w-4 h-4 text-red-400" />
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val)

  // ---- PROFILE DIALOG CONTENT ----
  const ProfileTab = () => {
    if (!detail) return null
    const c = detail.caregiver
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-gray-50 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Personal Info</h4>
            <div className="space-y-2">
              <InfoRow label="Profile ID" value={c.caregiverId} />
              <InfoRow label="Full Name" value={c.name} />
              <InfoRow label="Phone" value={c.phone} icon={<Phone className="w-3.5 h-3.5 text-gray-400" />} />
              <InfoRow label="Email" value={c.email || 'N/A'} icon={<Mail className="w-3.5 h-3.5 text-gray-400" />} />
              <InfoRow label="Specialty" value={specialtyLabel[c.specialty] || c.specialty} />
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Professional Info</h4>
            <div className="space-y-2">
              <InfoRow label="Experience" value={`${c.experience} years`} icon={<Award className="w-3.5 h-3.5 text-gray-400" />} />
              <InfoRow label="Qualifications" value={c.qualifications || 'N/A'} />
              <InfoRow label="Rating" value={c.rating > 0 ? `${c.rating.toFixed(1)} / 5.0` : 'No ratings yet'} />
              <InfoRow label="Joined" value={new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className={cn('text-xs px-3 py-1', c.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600')}>
            {c.isAvailable ? 'Available' : 'Unavailable'}
          </Badge>
          <Badge variant="secondary" className={cn('text-xs px-3 py-1', c.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-600')}>
            {c.isVerified ? 'Verified' : 'Not Verified'}
          </Badge>
          <Badge variant="secondary" className="text-xs px-3 py-1 bg-gray-100 text-gray-600">
            {detail.bookings?.length || 0} Total Bookings
          </Badge>
        </div>
      </div>
    )
  }

  const DocumentsTab = () => {
    if (!detail) return null
    const docs = detail.verificationRecord?.documents || []
    const docTypes = ['Aadhaar Card', 'Police Certificate', 'Medical Fitness Certificate', 'Video Verification']
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {docTypes.map((dt) => {
            const found = docs.find((d) => d.type.toLowerCase().includes(dt.toLowerCase().split(' ')[0].toLowerCase()))
            return (
              <div key={dt} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-800">{dt}</span>
                  </div>
                  {found ? (
                    <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-600 border border-green-100">Uploaded</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] bg-orange-50 text-orange-600 border border-orange-100">Pending</Badge>
                  )}
                </div>
                {found ? (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">File: {found.type}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="text-xs h-7 border-blue-200 text-blue-600">
                        <Eye className="w-3 h-3 mr-1" /> View
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs h-7">
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                    <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1" />
                    <p className="text-xs text-gray-400 mb-2">No document uploaded</p>
                    <Button
                      size="sm" variant="outline" className="text-xs h-7 border-blue-200 text-blue-600"
                      disabled={uploading}
                      onClick={() => handleUpload(dt)}
                    >
                      {uploading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Upload className="w-3 h-3 mr-1" />}
                      Upload
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const VerificationTab = () => {
    if (!detail) return null
    const vs = detail.verificationStatus
    const pending = detail.pendingVerifications
    const verifications = [
      { label: 'Aadhaar Verification', key: 'aadhaar', desc: 'Government ID verification via Aadhaar card' },
      { label: 'Police Verification', key: 'police', desc: 'Background check through police records' },
      { label: 'Medical Fitness', key: 'medical', desc: 'Medical fitness certificate from registered practitioner' },
      { label: 'Video Verification', key: 'video', desc: 'Live video call verification of identity and credentials' },
    ] as const
    return (
      <div className="space-y-4">
        {pending.length === 0 ? (
          <div className="rounded-xl bg-green-50 border border-green-100 p-5 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">All Verifications Complete</p>
            <p className="text-xs text-green-600 mt-1">This caregiver has passed all verification checks</p>
          </div>
        ) : (
          <div className="rounded-xl bg-orange-50 border border-orange-100 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <p className="text-sm font-medium text-orange-700">{pending.length} Pending Verification{pending.length > 1 ? 's' : ''}</p>
            </div>
            <p className="text-xs text-orange-600">{pending.join(', ')} — action required</p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {verifications.map((v) => {
            const done = vs[v.key]
            return (
              <div key={v.key} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{v.label}</span>
                  {done ? (
                    <Badge variant="secondary" className="text-[10px] bg-green-50 text-green-600 border border-green-100 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] bg-red-50 text-red-500 border border-red-100 flex items-center gap-1">
                      <X className="w-3 h-3" /> Pending
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-400">{v.desc}</p>
              </div>
            )
          })}
        </div>
        {detail.verificationRecord && (
          <div className="rounded-xl bg-gray-50 p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">Verification Record</h4>
            <InfoRow label="Package" value={detail.verificationRecord.package || 'N/A'} />
            <InfoRow label="Status" value={detail.verificationRecord.status} />
            <InfoRow label="Applied On" value={new Date(detail.verificationRecord.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} />
            {detail.verificationRecord.reviewNotes && <InfoRow label="Review Notes" value={detail.verificationRecord.reviewNotes} />}
          </div>
        )}
      </div>
    )
  }

  const EarningsTab = () => {
    if (!detail) return null
    const e = detail.earnings
    if (!e) return <p className='text-sm text-gray-400'>No earnings data</p>
    const months = Object.entries(e.monthlyEarnings || {}).sort().slice(-6)
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Revenue" value={formatCurrency(e.totalEarnings)} icon={<IndianRupee className="w-4 h-4" />} color="blue" />
          <StatCard label="Platform Commission" value={formatCurrency(e.totalCommission)} icon={<BarChart3 className="w-4 h-4" />} color="orange" />
          <StatCard label="Net Earnings" value={formatCurrency(e.netEarnings)} icon={<IndianRupee className="w-4 h-4" />} color="green" />
          <StatCard label="Completed" value={`${e.completedBookings}/${e.totalBookings}`} icon={<CheckCircle2 className="w-4 h-4" />} color="purple" />
        </div>
        {months.length > 0 && (
          <div className="rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">Monthly Revenue Trend</h4>
            <div className="space-y-2">
              {months.map(([month, amount]) => {
                const maxAmt = Math.max(...months.map(([, a]) => a), 1)
                const pct = (amount / maxAmt) * 100
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16 shrink-0">{month}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.max(pct, 8)}%` }}>
                        <span className="text-[10px] text-white font-medium whitespace-nowrap">{formatCurrency(amount)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  const AnalyticsTab = () => {
    if (!detail) return null
    const a = detail.analytics
    if (!a) return <p className='text-sm text-gray-400'>No analytics data</p>
    const statusEntries = Object.entries(a.statusBreakdown || {})
    const dayEntries = Object.entries(a.dayBreakdown || {})
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const sortedDays = dayEntries.sort((a, b) => dayOrder.indexOf(a[0]) - dayOrder.indexOf(b[0]))
    const maxDay = Math.max(...sortedDays.map(([, v]) => v), 1)
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Total Bookings" value={String(detail.bookings?.length || 0)} icon={<CalendarDays className="w-4 h-4" />} color="blue" />
          <StatCard label="Avg Rating" value={`${(a.averageRating || 0).toFixed(1)}/5`} icon={<Star className="w-4 h-4" />} color="amber" />
          <StatCard label="Completion Rate" value={detail.bookings?.length > 0 ? `${Math.round(((a.statusBreakdown?.completed || 0) / detail.bookings.length) * 100)}%` : 'N/A'} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {statusEntries.length > 0 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">Booking Status</h4>
              <div className="space-y-2">
                {statusEntries.map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn('text-[10px]', statusColor[status] || 'bg-gray-100 text-gray-600')}>
                        {status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${detail.bookings?.length ? (count / detail.bookings.length) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {sortedDays.length > 0 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-3">Bookings by Day</h4>
              <div className="space-y-2">
                {sortedDays.map(([day, count]) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-8 shrink-0">{day}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-2 transition-all" style={{ width: `${Math.max((count / maxDay) * 100, 10)}%` }}>
                        <span className="text-[10px] text-white font-medium">{count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const BookingsTab = () => {
    if (!detail) return null
    if (detail.bookings.length === 0) {
      return <div className="text-center py-8 text-gray-400 text-sm">No bookings found for this caregiver</div>
    }
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Booking ID</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Patient</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Service</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Date</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Mode</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {detail.bookings.map((b) => (
              <TableRow key={b.id} className="hover:bg-gray-50/50">
                <TableCell className="text-xs font-mono text-blue-600">{b.bookingId}</TableCell>
                <TableCell>
                  <p className="text-sm text-gray-800">{b.patientName}</p>
                  <p className="text-[10px] text-gray-400">{b.patientUhid}</p>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{b.serviceName}</TableCell>
                <TableCell className="text-sm text-gray-600">{b.date}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn('text-[10px]', b.mode === 'online' ? 'bg-purple-50 text-purple-600' : 'bg-teal-50 text-teal-600')}>
                    {b.mode === 'online' ? 'Online' : 'In-Home'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn('text-[10px] capitalize', statusColor[b.status] || 'bg-gray-100 text-gray-600')}>
                    {b.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-medium text-gray-800">{formatCurrency(b.totalAmount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-blue-600" />
            Caregivers
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Add Caregiver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Add New Caregiver</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Specialty *</Label>
                  <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                    <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child_care">Child Care</SelectItem>
                      <SelectItem value="elder_care">Elder Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Experience (years)</Label>
                  <Input type="number" min="0" placeholder="Years of experience" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Qualifications</Label>
                  <Textarea placeholder="Certifications, training, etc." value={form.qualifications} onChange={(e) => setForm({ ...form, qualifications: e.target.value })} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Add Caregiver
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pb-3 pt-1 flex flex-wrap items-center gap-3 border-b border-gray-100">
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-[150px] h-8 text-sm"><SelectValue placeholder="Specialty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="child_care">Child Care</SelectItem>
                <SelectItem value="elder_care">Elder Care</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-sm"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-[140px] h-8 text-sm"><SelectValue placeholder="Verified" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Verified</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Profile ID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Phone</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Specialty</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Experience</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Rating</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-center">Aadhaar</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-center">Police</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-center">Medical</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-center">Video</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 12 }).map((_, j) => (<TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>))}</TableRow>
                  ))
                ) : caregivers.length > 0 ? (
                  caregivers.map((c) => (
                    <TableRow key={c.id} className="hover:bg-gray-50/50">
                      <TableCell className="text-xs font-mono text-blue-600 font-medium">{c.caregiverId}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-gray-900">{c.name}</p>
                        {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{c.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px] capitalize', specialtyBadge[c.specialty] || 'bg-gray-100 text-gray-700')}>
                          {specialtyLabel[c.specialty] || c.specialty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{c.experience} yrs</TableCell>
                      <TableCell>{renderStarRating(c.rating)}</TableCell>
                      <TableCell className="text-center"><VerificationIcon verified={c.isAadhaarVerified} /></TableCell>
                      <TableCell className="text-center"><VerificationIcon verified={c.isPoliceVerified} /></TableCell>
                      <TableCell className="text-center"><VerificationIcon verified={c.isMedicalVerified} /></TableCell>
                      <TableCell className="text-center"><VerificationIcon verified={c.isVideoVerified} /></TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px]', c.isAvailable ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700')}>
                          {c.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => openProfile(c.id)}>
                          <Eye className="w-3 h-3 mr-1" /> View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-8 text-gray-400 text-sm">No caregivers found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ===== CAREGIVER DETAIL DIALOG ===== */}
      <Dialog open={profileOpen} onOpenChange={(open) => { setProfileOpen(open); if (!open) { setDetail(null); setSelectedId(null) } }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCog className="w-5 h-5 text-blue-600" />
              {detail ? detail.caregiver.name : 'Caregiver Profile'}
              {detail && <span className="text-sm font-mono font-normal text-blue-600 ml-1">{detail.caregiver.caregiverId}</span>}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <div className="space-y-4 py-6">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : detail ? (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="w-full justify-start bg-gray-100 rounded-lg p-1 h-auto flex-wrap gap-1">
                <TabsTrigger value="profile" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 h-8">
                  <UserCog className="w-3.5 h-3.5 mr-1" /> Profile
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 h-8">
                  <FileText className="w-3.5 h-3.5 mr-1" /> Documents
                </TabsTrigger>
                <TabsTrigger value="verification" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 h-8 relative">
                  <Shield className="w-3.5 h-3.5 mr-1" /> Verification
                  {detail.pendingVerifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                      {detail.pendingVerifications.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="earnings" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 h-8">
                  <IndianRupee className="w-3.5 h-3.5 mr-1" /> Earnings
                </TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 h-8">
                  <BarChart3 className="w-3.5 h-3.5 mr-1" /> Analytics
                </TabsTrigger>
                <TabsTrigger value="bookings" className="text-xs data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-md px-3 h-8">
                  <CalendarDays className="w-3.5 h-3.5 mr-1" /> Bookings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="profile" className="mt-4"><ProfileTab /></TabsContent>
              <TabsContent value="documents" className="mt-4"><DocumentsTab /></TabsContent>
              <TabsContent value="verification" className="mt-4"><VerificationTab /></TabsContent>
              <TabsContent value="earnings" className="mt-4"><EarningsTab /></TabsContent>
              <TabsContent value="analytics" className="mt-4"><AnalyticsTab /></TabsContent>
              <TabsContent value="bookings" className="mt-4"><BookingsTab /></TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---- Reusable Components ----

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 break-words">{value}</p>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', colorMap[color] || 'bg-gray-100 text-gray-500')}>
          {icon}
        </div>
        <span className="text-[11px] text-gray-400">{label}</span>
      </div>
      <p className="text-lg font-bold text-gray-900">{value}</p>
    </div>
  )
}
