'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  ShieldCheck, Loader2, RefreshCw, AlertCircle, FileText, Eye,
  Search, UserCheck, UserX, Stethoscope, HeartPulse, Ban, Unlock,
  Upload, Clock, CheckCircle2, XCircle, IndianRupee, Phone, Mail,
  GraduationCap, Briefcase, Wifi, WifiOff, AlertTriangle,
} from 'lucide-react'

// ── Types ──

interface VerificationDoc {
  type: string
  url: string
  verified?: boolean
  uploadedAt?: string
  rejectedAt?: string
  rejectionReason?: string
}

interface DocType {
  key: string
  label: string
}

interface CaregiverChecks {
  aadhaarVerified: boolean
  policeVerified: boolean
  medicalFitness: boolean
  videoVerified: boolean
}

interface Verification {
  id: string
  entityType: 'doctor' | 'caregiver'
  entityId: string
  entityName: string
  entityPhone: string
  entityEmail: string
  entitySpecialty: string
  entityQualifications: string
  entityExperience: number
  feeOnline: number | null
  feeAtHome: number | null
  isOnline: boolean | null
  caregiverChecks: CaregiverChecks | null
  status: string
  package: string | null
  documents: VerificationDoc[]
  docTypes: { mandatory: DocType[]; optional: DocType[] }
  mandatoryPending: string[]
  mandatoryCount: number
  uploadedCount: number
  attemptCount: number
  attemptsRemaining: number
  isSuspended: boolean
  suspensionReason: string | null
  reviewNotes: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
}

// ── Constants ──

const MAX_ATTEMPTS = 3

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  pending:     { color: 'bg-yellow-100 text-yellow-700',  icon: <Clock className="w-3.5 h-3.5" />,       label: 'Pending Review' },
  resubmitted: { color: 'bg-blue-100 text-blue-700',      icon: <Upload className="w-3.5 h-3.5" />,     label: 'Resubmitted' },
  in_progress: { color: 'bg-indigo-100 text-indigo-700',  icon: <Loader2 className="w-3.5 h-3.5" />,    label: 'In Progress' },
  approved:    { color: 'bg-green-100 text-green-700',    icon: <UserCheck className="w-3.5 h-3.5" />,  label: 'Approved' },
  rejected:    { color: 'bg-red-100 text-red-700',         icon: <UserX className="w-3.5 h-3.5" />,     label: 'Rejected' },
  suspended:   { color: 'bg-gray-800 text-gray-100',       icon: <Ban className="w-3.5 h-3.5" />,       label: 'Suspended' },
}

function formatDate(iso: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return iso }
}

function formatDateShort(iso: string) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  } catch { return iso }
}

type TabValue = 'doctors' | 'caregivers'

// ── Component ──

export function VerificationSection() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<TabValue>('doctors')
  const [doctors, setDoctors] = useState<Verification[]>([])
  const [caregivers, setCaregivers] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)

  // Review dialog (approve/reject)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Unsuspend dialog
  const [unsuspendOpen, setUnsuspendOpen] = useState(false)
  const [unsuspendNotes, setUnsuspendNotes] = useState('')
  const [unsuspending, setUnsuspending] = useState(false)

  // ── Fetch ──
  const fetchVerifications = useCallback(async (type: TabValue) => {
    try {
      const res = await fetch(`/api/verification?type=${type === 'doctors' ? 'doctor' : 'caregiver'}`)
      if (res.ok) {
        const json = await res.json()
        const list: Verification[] = Array.isArray(json) ? json : json?.data || []
        if (type === 'doctors') setDoctors(list)
        else setCaregivers(list)
      } else {
        toast({ title: 'Error', description: 'Failed to fetch verifications', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    }
  }, [toast])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setSearchQuery('')
    await Promise.all([fetchVerifications('doctors'), fetchVerifications('caregivers')])
    setLoading(false)
  }, [fetchVerifications])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Helpers ──
  const currentList = activeTab === 'doctors' ? doctors : caregivers
  const filteredList = searchQuery.trim()
    ? currentList.filter((v) =>
        v.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.entityPhone.includes(searchQuery) ||
        v.entityEmail.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentList

  const countByStatus = (list: Verification[], ...statuses: string[]) =>
    list.filter((v) => statuses.includes(v.status)).length

  const openDetail = (v: Verification) => { setSelectedVerification(v); setDetailOpen(true) }

  const openReview = (v: Verification, act: 'approved' | 'rejected') => {
    setSelectedVerification(v)
    setAction(act)
    setReviewNotes(v.reviewNotes || '')
    setReviewOpen(true)
  }

  const openUnsuspend = (v: Verification) => {
    setSelectedVerification(v)
    setUnsuspendNotes('')
    setUnsuspendOpen(true)
  }

  // ── Approve / Reject ──
  const handleSubmitReview = async () => {
    if (!selectedVerification || !action) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/verification/${selectedVerification.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, reviewNotes: reviewNotes || null, reviewedBy: 'admin' }),
      })
      if (res.ok) {
        const data = await res.json()
        const meta = data._meta
        if (meta?.wasSuspended) {
          toast({
            title: 'Account Suspended',
            description: `${selectedVerification.entityName} has exceeded ${MAX_ATTEMPTS} verification attempts and is now suspended.`,
            variant: 'destructive',
          })
        } else {
          toast({
            title: action === 'approved' ? 'Verification Approved' : 'Verification Rejected',
            description: `${selectedVerification.entityName} — Attempt ${meta?.attemptsUsed}/${MAX_ATTEMPTS}`,
          })
        }
        setReviewOpen(false)
        setDetailOpen(false)
        await fetchVerifications(activeTab)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally { setSubmitting(false) }
  }

  // ── Unsuspend ──
  const handleUnsuspend = async () => {
    if (!selectedVerification) return
    setUnsuspending(true)
    try {
      const res = await fetch(`/api/verification/${selectedVerification.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsuspend', notes: unsuspendNotes || null }),
      })
      if (res.ok) {
        toast({
          title: 'Account Unsuspended',
          description: `${selectedVerification.entityName} can now re-submit documents for verification.`,
        })
        setUnsuspendOpen(false)
        setDetailOpen(false)
        await fetchVerifications(activeTab)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to unsuspend', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally { setUnsuspending(false) }
  }

  // ── Summary cards ──
  const renderSummaryCards = (list: Verification[], entityType: 'doctor' | 'caregiver') => {
    const pending = countByStatus(list, 'pending', 'resubmitted')
    const approved = countByStatus(list, 'approved')
    const rejected = countByStatus(list, 'rejected')
    const suspended = countByStatus(list, 'suspended')

    const cards = [
      { label: 'Pending Review', count: pending, color: 'bg-yellow-100 text-yellow-600', icon: <AlertCircle className="w-5 h-5" /> },
      { label: 'Approved', count: approved, color: 'bg-green-100 text-green-600', icon: <UserCheck className="w-5 h-5" /> },
      { label: 'Rejected', count: rejected, color: 'bg-red-100 text-red-600', icon: <UserX className="w-5 h-5" /> },
      { label: 'Suspended', count: suspended, color: 'bg-gray-800 text-gray-100', icon: <Ban className="w-5 h-5" /> },
    ]

    return cards.map((card) => (
      <Card key={card.label} className="bg-white rounded-xl shadow-sm border-0">
        <CardContent className="p-4 flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', card.color)}>
            {card.icon}
          </div>
          <div>
            {loading ? <Skeleton className="h-7 w-8" /> : <p className="text-2xl font-bold text-gray-900">{card.count}</p>}
            <p className="text-xs text-gray-500">{card.label}</p>
          </div>
        </CardContent>
      </Card>
    ))
  }

  // ── Documents progress for a verification ──
  const getDocStatus = (v: Verification) => {
    const mandatoryTotal = v.mandatoryCount
    const uploadedTotal = v.uploadedCount
    if (uploadedTotal === 0) return { text: 'No docs', color: 'text-gray-500', bgColor: 'bg-gray-100' }
    const uploadedMandatory = mandatoryTotal - v.mandatoryPending.length
    if (uploadedMandatory < mandatoryTotal) return { text: `${uploadedMandatory}/${mandatoryTotal} mandatory`, color: 'text-amber-700', bgColor: 'bg-amber-100' }
    return { text: `${uploadedTotal} docs`, color: 'text-green-700', bgColor: 'bg-green-100' }
  }

  // ── Table ──
  const renderTable = (items: Verification[], entityType: 'doctor' | 'caregiver') => (
    <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
            <TableHead className="text-xs font-semibold uppercase text-gray-500">{entityType === 'doctor' ? 'Doctor' : 'Caregiver'}</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Specialty</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Contact</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Documents</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Attempts</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 7 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length > 0 ? (
            items.map((v) => {
              const docStatus = getDocStatus(v)
              const cfg = statusConfig[v.status] || statusConfig.pending
              const canAct = v.status === 'pending' || v.status === 'resubmitted'
              return (
                <TableRow key={v.id} className={cn('hover:bg-gray-50/50', v.isSuspended && 'bg-gray-50/80')}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                        entityType === 'doctor' ? 'bg-blue-500' : 'bg-orange-500'
                      )}>
                        {v.entityName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{v.entityName}</p>
                        <p className="text-[11px] text-gray-500">{v.entityQualifications || '—'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-700">{v.entitySpecialty || '—'}</TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-700">{v.entityPhone || '—'}</div>
                    {v.entityEmail && <div className="text-[11px] text-gray-400">{v.entityEmail}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn('text-[11px]', docStatus.bgColor, docStatus.color)}>
                      <FileText className="w-3 h-3 mr-1" />
                      {docStatus.text}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        'text-xs font-medium',
                        v.attemptCount >= MAX_ATTEMPTS ? 'text-red-600' : v.attemptsRemaining <= 1 ? 'text-amber-600' : 'text-gray-700'
                      )}>
                        {v.attemptCount}/{MAX_ATTEMPTS}
                      </span>
                      {v.attemptsRemaining > 0 && (
                        <span className="text-[10px] text-gray-400">({v.attemptsRemaining} left)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={cn('text-[11px] capitalize flex items-center gap-1 w-fit', cfg.color)}>
                      {cfg.icon}
                      {cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button size="sm" variant="ghost" className="text-[11px] text-gray-600 hover:text-blue-600 hover:bg-blue-50 h-7 px-2" onClick={() => openDetail(v)}>
                        <Eye className="w-3.5 h-3.5 mr-1" />View
                      </Button>
                      {canAct && (
                        <>
                          <Button size="sm" className="text-[11px] bg-green-600 hover:bg-green-700 text-white h-7 px-2" onClick={() => openReview(v, 'approved')}>
                            <UserCheck className="w-3.5 h-3.5 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="text-[11px] border-red-200 text-red-600 hover:bg-red-50 h-7 px-2" onClick={() => openReview(v, 'rejected')}>
                            <UserX className="w-3.5 h-3.5 mr-1" />Reject
                          </Button>
                        </>
                      )}
                      {v.isSuspended && (
                        <Button size="sm" variant="outline" className="text-[11px] border-amber-300 text-amber-700 hover:bg-amber-50 h-7 px-2" onClick={() => openUnsuspend(v)}>
                          <Unlock className="w-3.5 h-3.5 mr-1" />Unsuspend
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                No verification requests found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )

  // ── Detail Dialog ──
  const renderDetailDialog = () => {
    const v = selectedVerification
    if (!v) return null

    const cfg = statusConfig[v.status] || statusConfig.pending
    const isDoctor = v.entityType === 'doctor'
    const canAct = v.status === 'pending' || v.status === 'resubmitted'

    // Build doc map by key
    const docMap = new Map(v.documents.map((d) => [d.type, d]))

    return (
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isDoctor ? <Stethoscope className="w-5 h-5 text-blue-600" /> : <HeartPulse className="w-5 h-5 text-orange-600" />}
              Verification Details
              <Badge variant="secondary" className={cn('ml-auto text-xs capitalize', cfg.color)}>
                {cfg.icon}{cfg.label}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Suspension Banner */}
            {v.isSuspended && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <Ban className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Account Suspended</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {v.suspensionReason || `Maximum ${MAX_ATTEMPTS} verification attempts exceeded.`}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    User cannot re-submit documents. Admin must unsuspend the account first.
                  </p>
                </div>
              </div>
            )}

            {/* Rejection info */}
            {v.status === 'rejected' && !v.isSuspended && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Rejection Info</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {v.reviewNotes || 'Documents did not meet requirements.'}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Attempt {v.attemptCount}/{MAX_ATTEMPTS} used. {v.attemptsRemaining} attempt{v.attemptsRemaining !== 1 ? 's' : ''} remaining.
                    User can re-upload documents and resubmit.
                  </p>
                </div>
              </div>
            )}

            {/* Resubmitted banner */}
            {v.status === 'resubmitted' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Upload className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Resubmitted for Review</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    User has re-uploaded documents. Attempt {v.attemptCount}/{MAX_ATTEMPTS}.
                  </p>
                </div>
              </div>
            )}

            {/* Personal Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Personal Information
              </h4>
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold shrink-0',
                  isDoctor ? 'bg-blue-500' : 'bg-orange-500'
                )}>
                  {v.entityName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-gray-900">{v.entityName}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.entityPhone || '—'}</span>
                    {v.entityEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{v.entityEmail}</span>}
                  </div>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div><span className="text-gray-400">Submitted:</span> <span className="text-gray-700">{formatDateShort(v.createdAt)}</span></div>
                  {v.reviewedAt && <div><span className="text-gray-400">Reviewed:</span> <span className="text-gray-700">{formatDateShort(v.reviewedAt)}</span></div>}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[11px] text-gray-400">Specialty</p>
                  <p className="text-sm font-medium text-gray-900">{v.entitySpecialty || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Qualifications</p>
                  <p className="text-sm font-medium text-gray-900">{v.entityQualifications || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Experience</p>
                  <p className="text-sm font-medium text-gray-900">{v.entityExperience > 0 ? `${v.entityExperience} yrs` : '—'}</p>
                </div>
                {isDoctor ? (
                  <>
                    <div>
                      <p className="text-[11px] text-gray-400">Fee (Online)</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" />{v.feeOnline || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Fee (At Home)</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-0.5">
                        <IndianRupee className="w-3 h-3" />{v.feeAtHome || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Online Status</p>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        {v.isOnline ? <><Wifi className="w-3 h-3 text-green-600" />Online</> : <><WifiOff className="w-3 h-3 text-gray-400" />Offline</>}
                      </p>
                    </div>
                  </>
                ) : v.caregiverChecks ? (
                  <>
                    <div>
                      <p className="text-[11px] text-gray-400">Aadhaar</p>
                      <CheckBadge checked={v.caregiverChecks.aadhaarVerified} />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Police</p>
                      <CheckBadge checked={v.caregiverChecks.policeVerified} />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Medical</p>
                      <CheckBadge checked={v.caregiverChecks.medicalFitness} />
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-400">Video</p>
                      <CheckBadge checked={v.caregiverChecks.videoVerified} />
                    </div>
                  </>
                ) : null}
              </div>
              {/* Attempt Progress */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-gray-400">Verification Attempts</span>
                  <span className={cn(
                    'text-[11px] font-medium',
                    v.attemptsRemaining === 0 ? 'text-red-600' : v.attemptsRemaining === 1 ? 'text-amber-600' : 'text-gray-600'
                  )}>
                    Attempt {v.attemptCount} of {MAX_ATTEMPTS}
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div key={i} className={cn(
                      'h-1.5 flex-1 rounded-full',
                      i < v.attemptCount
                        ? v.isSuspended ? 'bg-red-500' : v.status === 'approved' ? 'bg-green-500' : 'bg-amber-400'
                        : 'bg-gray-200'
                    )} />
                  ))}
                </div>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Uploaded Documents ({v.documents.length})
              </h4>
              {v.documents.length > 0 ? (
                <div className="space-y-1">
                  {v.documents.map((doc) => (
                    <div key={doc.type} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {doc.verified ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <div>
                          <p className="text-sm text-gray-800">{findDocLabel(v, doc.type)}</p>
                          {doc.uploadedAt && <p className="text-[10px] text-gray-400">Uploaded {formatDateShort(doc.uploadedAt)}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.rejectionReason && (
                          <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{doc.rejectionReason}</span>
                        )}
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <Eye className="w-3 h-3" />View
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">No documents uploaded yet</p>
              )}
            </div>

            {/* Mandatory Documents Pending */}
            {v.mandatoryPending.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Mandatory Documents Pending ({v.mandatoryPending.length})
                </h4>
                <div className="space-y-1">
                  {v.mandatoryPending.map((key) => (
                    <div key={key} className="flex items-center gap-2 py-1.5 px-3 bg-red-50 rounded-lg">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-800">{findDocLabel(v, key)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5">
                  {isDoctor
                    ? 'As per NMC (National Medical Commission) guidelines, all mandatory documents are required for verification.'
                    : 'All mandatory documents must be uploaded before verification can be approved.'}
                </p>
              </div>
            )}

            {/* Optional Documents */}
            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Optional Documents
              </h4>
              <div className="space-y-1">
                {v.docTypes.optional.map((dt) => {
                  const doc = docMap.get(dt.key)
                  return (
                    <div key={dt.key} className="flex items-center justify-between py-1.5 px-3 bg-gray-50/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {doc ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
                        <span className="text-sm text-gray-600">{dt.label}</span>
                      </div>
                      {doc && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Review Notes (if previously reviewed) */}
            {v.reviewNotes && v.status !== 'pending' && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[11px] text-gray-400 mb-1">Admin Review Notes</p>
                <p className="text-sm text-gray-700">{v.reviewNotes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {v.isSuspended ? (
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { setDetailOpen(false); openUnsuspend(v) }}>
                  <Unlock className="w-4 h-4 mr-2" />Unsuspend Account
                </Button>
              ) : canAct ? (
                <>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setDetailOpen(false); openReview(v, 'approved') }}>
                    <ShieldCheck className="w-4 h-4 mr-2" />Approve
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => { setDetailOpen(false); openReview(v, 'rejected') }}>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {v.attemptsRemaining <= 1 ? `Reject (Final)` : 'Reject'}
                  </Button>
                </>
              ) : v.status === 'approved' ? (
                <div className="flex-1 text-center py-2 text-sm text-green-700 font-medium bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />Verified & Approved
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Approve/Reject Dialog ──
  const renderReviewDialog = () => {
    const v = selectedVerification
    if (!v || !action) return null

    const isFinal = action === 'rejected' && v.attemptsRemaining <= 1

    return (
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === 'approved' ? (
                <ShieldCheck className="w-5 h-5 text-green-600" />
              ) : (
                <UserX className="w-5 h-5 text-red-600" />
              )}
              {action === 'approved' ? 'Approve Verification' : 'Reject Verification'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-24">Name</span>
                <span className="text-sm font-medium text-gray-900">{v.entityName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-24">Type</span>
                <Badge variant="secondary" className={cn(
                  'text-[11px] capitalize',
                  v.entityType === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                )}>
                  {v.entityType}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-24">Attempt</span>
                <span className="text-sm text-gray-900">{v.attemptCount}/{MAX_ATTEMPTS}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-24">Docs</span>
                <span className="text-sm text-gray-900">{v.uploadedCount} uploaded, {v.mandatoryPending.length} mandatory pending</span>
              </div>
            </div>
            {isFinal && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Final Rejection Warning</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    This is the last attempt. Rejecting will permanently suspend {v.entityName}'s account.
                    Suspended accounts require admin review and manual unsuspension.
                  </p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>{action === 'approved' ? 'Approval Notes (optional)' : 'Rejection Reason'}</Label>
              <Textarea
                placeholder={action === 'approved'
                  ? 'Optional notes...'
                  : 'Specify which documents need correction...'}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button
              className={cn('text-white', action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700')}
              onClick={handleSubmitReview}
                  disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {action === 'approved' ? 'Approve' : isFinal ? 'Reject & Suspend' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Unsuspend Dialog ──
  const renderUnsuspendDialog = () => {
    const v = selectedVerification
    if (!v) return null

    return (
      <Dialog open={unsuspendOpen} onOpenChange={setUnsuspendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Unlock className="w-5 h-5 text-amber-600" />
              Unsuspend Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-700 w-24">Name</span>
                <span className="text-sm font-medium text-gray-900">{v.entityName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-amber-700 w-24">Suspension</span>
                <span className="text-sm text-gray-700">{v.suspensionReason || `Max ${MAX_ATTEMPTS} attempts exceeded`}</span>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>What happens:</strong> The account will be unsuspended and status reset to pending.
                The attempt counter will be reset to 0, giving the user {MAX_ATTEMPTS} fresh attempts to submit documents.
                The user will be notified they can re-upload documents.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Admin Notes (optional)</Label>
              <Textarea
                placeholder="Reason for unsuspension / instructions for user..."
                value={unsuspendNotes}
                onChange={(e) => setUnsuspendNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnsuspendOpen(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleUnsuspend} disabled={unsuspending}>
              {unsuspending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Unsuspend & Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ── Main Render ──
  return (
    <div className="space-y-6 p-4 md:p-6">
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as TabValue)} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="doctors" className="gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              Doctors
              {!loading && countByStatus(doctors, 'pending', 'resubmitted') > 0 && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-yellow-500 text-white border-0">
                  {countByStatus(doctors, 'pending', 'resubmitted')}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="caregivers" className="gap-1.5">
              <HeartPulse className="w-3.5 h-3.5" />
              Caregivers
              {!loading && countByStatus(caregivers, 'pending', 'resubmitted') > 0 && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-yellow-500 text-white border-0">
                  {countByStatus(caregivers, 'pending', 'resubmitted')}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Search by name, phone, email..."
                className="h-8 pl-8 text-xs w-full sm:w-56"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="sm" variant="outline" className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5 h-8" onClick={fetchAll} disabled={loading}>
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="doctors" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {renderSummaryCards(doctors, 'doctor')}
          </div>
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                Doctor Verifications
                {!loading && <span className="text-sm font-normal text-gray-500 ml-2">({doctors.length} total)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderTable(filteredList, 'doctor')}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="caregivers" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {renderSummaryCards(caregivers, 'caregiver')}
          </div>
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                Caregiver Verifications
                {!loading && <span className="text-sm font-normal text-gray-500 ml-2">({caregivers.length} total)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderTable(filteredList, 'caregiver')}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renderDetailDialog()}
      {renderReviewDialog()}
      {renderUnsuspendDialog()}
    </div>
  )
}

// ── Helper: find label by key ──
function findDocLabel(v: Verification, key: string): string {
  const all = [...v.docTypes.mandatory, ...v.docTypes.optional]
  return all.find((d) => d.key === key)?.label || key
}

// ── Helper: check badge for caregiver ──
function CheckBadge({ checked }: { checked: boolean }) {
  if (checked) return <span className="text-sm font-medium text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Verified</span>
  return <span className="text-sm text-gray-400">Pending</span>
}
