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

  // Entity verifications for detail dialog
  const [entityVerifications, setEntityVerifications] = useState<Verification[]>([])
  const [activePkgTab, setActivePkgTab] = useState('all')
  const [overlayImg, setOverlayImg] = useState<{ url: string; label: string } | null>(null)

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
        (v.entityEmail || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentList

  const countByStatus = (list: Verification[], ...statuses: string[]) =>
    list.filter((v) => statuses.includes(v.status)).length

  const uniqueEntityCounts = (list: Verification[]) => {
    const map = new Map<string, string[]>()
    for (const v of list) { map.set(v.entityId, [...(map.get(v.entityId) || []), v.status]) }
    let pending = 0, approved = 0, rejected = 0, suspended = 0
    for (const [, ss] of map) {
      if (ss.includes('suspended')) suspended++
      else if (ss.every(s => s === 'approved')) approved++
      else if (ss.some(s => s === 'rejected')) rejected++
      else pending++
    }
    return { pending, approved, rejected, suspended }
  }

  const countUniqueByStatus = (list: Verification[], ...statuses: string[]) =>
    new Set(list.filter(v => statuses.includes(v.status)).map(v => v.entityId)).size

  const openDetail = (v: Verification, allForEntity?: Verification[]) => {
    setSelectedVerification(v)
    if (allForEntity && allForEntity.length > 1) {
      setEntityVerifications(allForEntity)
      setActivePkgTab(v.package || 'all')
    } else {
      setEntityVerifications([])
    }
    setDetailOpen(true)
  }

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
    const { pending, approved, rejected, suspended } = entityType === 'caregiver'
      ? uniqueEntityCounts(list)
      : { pending: countByStatus(list, 'pending', 'resubmitted'), approved: countByStatus(list, 'approved'), rejected: countByStatus(list, 'rejected'), suspended: countByStatus(list, 'suspended') }

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

  // ── Package label helper ──
  const pkgLabel = (pkg: string | null) => {
    const map: Record<string, string> = { aadhaar: 'Aadhaar', police: 'Police', medical: 'Medical', video: 'Video' }
    return pkg ? map[pkg] || pkg : '—'
  }

  // ── Table ──
  const renderTable = (items: Verification[], entityType: 'doctor' | 'caregiver') => {
    const isCaregiver = entityType === 'caregiver'
    let groupedItems: Verification[][]

    if (isCaregiver) {
      const entityMap = items.reduce<Record<string, Verification[]>>((acc, v) => {
        (acc[v.entityId] = acc[v.entityId] || []).push(v)
        return acc
      }, {})
      groupedItems = Object.values(entityMap).map((pkgList) => {
        pkgList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        return pkgList
      })
    } else {
      groupedItems = items.map((v) => [v])
    }

    const getCombinedStatus = (pkgs: Verification[]) => {
      if (pkgs.some((p) => p.isSuspended)) return 'suspended'
      if (pkgs.every((p) => p.status === 'approved')) return 'approved'
      if (pkgs.some((p) => p.status === 'pending' || p.status === 'resubmitted')) return 'pending'
      if (pkgs.some((p) => p.status === 'rejected')) return 'rejected'
      return 'pending'
    }

    const pendingPkg = (pkgs: Verification[]) => pkgs.find((p) => p.status === 'pending' || p.status === 'resubmitted') || pkgs[0]
    const suspendedPkg = (pkgs: Verification[]) => pkgs.find((p) => p.isSuspended)

    return (
      <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
              <TableHead className="text-xs font-semibold uppercase text-gray-500">{entityType === 'doctor' ? 'Doctor' : 'Caregiver'}</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Specialty</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Contact</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-gray-500">{isCaregiver ? 'Verifications' : 'Documents'}</TableHead>
              {isCaregiver && <TableHead className="text-xs font-semibold uppercase text-gray-500">Packages</TableHead>}
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-gray-500 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: isCaregiver ? 7 : 7 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : groupedItems.length > 0 ? (
              groupedItems.map((pkgList) => {
                const v = pkgList[0]
                const combinedStatus = getCombinedStatus(pkgList)
                const cfg = statusConfig[combinedStatus] || statusConfig.pending
                const canAct = !isCaregiver && (v.status === 'pending' || v.status === 'resubmitted')
                const pPkg = pendingPkg(pkgList)
                const sPkg = suspendedPkg(pkgList)

                return (
                  <TableRow key={v.entityId} className={cn('hover:bg-gray-50/50', sPkg && 'bg-gray-50/80')}>
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
                    {isCaregiver ? (
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pkgList.map((pkg) => {
                            const pkgCfg = statusConfig[pkg.status] || statusConfig.pending
                            return (
                              <Badge key={pkg.id} variant="secondary" className={cn('text-[10px] capitalize flex items-center gap-0.5', pkgCfg.color)}>
                                {pkgCfg.icon}
                                {pkgLabel(pkg.package)}
                              </Badge>
                            )
                          })}
                        </div>
                      </TableCell>
                    ) : (
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px]', getDocStatus(v).bgColor, getDocStatus(v).color)}>
                          <FileText className="w-3 h-3 mr-1" />
                          {getDocStatus(v).text}
                        </Badge>
                      </TableCell>
                    )}
                    {isCaregiver && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className={cn('text-xs font-medium', pkgList.length >= 4 ? 'text-green-600' : pkgList.length >= 2 ? 'text-amber-600' : 'text-gray-700')}>
                            {pkgList.length}/4
                          </span>
                          <span className="text-[10px] text-gray-400">pkgs</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="secondary" className={cn('text-[11px] capitalize flex items-center gap-1 w-fit', cfg.color)}>
                        {cfg.icon}
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" className="text-[11px] text-gray-600 hover:text-blue-600 hover:bg-blue-50 h-7 px-2" onClick={() => openDetail(v, pkgList.length > 1 ? pkgList : undefined)}>
                          <Eye className="w-3.5 h-3.5 mr-1" />View
                        </Button>
                        {isCaregiver ? (
                          <>
                            {pPkg && (pPkg.status === 'pending' || pPkg.status === 'resubmitted') && (
                              <Button size="sm" className="text-[11px] bg-green-600 hover:bg-green-700 text-white h-7 px-2" onClick={() => openReview(pPkg, 'approved')}>
                                <UserCheck className="w-3.5 h-3.5 mr-1" />Approve
                              </Button>
                            )}
                            {sPkg && (
                              <Button size="sm" variant="outline" className="text-[11px] border-amber-300 text-amber-700 hover:bg-amber-50 h-7 px-2" onClick={() => openUnsuspend(sPkg)}>
                                <Unlock className="w-3.5 h-3.5 mr-1" />Unsuspend
                              </Button>
                            )}
                          </>
                        ) : (
                          <>
                            {canAct && (
                              <Button size="sm" className="text-[11px] bg-green-600 hover:bg-green-700 text-white h-7 px-2" onClick={() => openReview(v, 'approved')}>
                                <UserCheck className="w-3.5 h-3.5 mr-1" />Approve
                              </Button>
                            )}
                            {canAct && (
                              <Button size="sm" variant="outline" className="text-[11px] border-red-200 text-red-600 hover:bg-red-50 h-7 px-2" onClick={() => openReview(v, 'rejected')}>
                                <UserX className="w-3.5 h-3.5 mr-1" />Reject
                              </Button>
                            )}
                            {v.isSuspended && (
                              <Button size="sm" variant="outline" className="text-[11px] border-amber-300 text-amber-700 hover:bg-amber-50 h-7 px-2" onClick={() => openUnsuspend(v)}>
                                <Unlock className="w-3.5 h-3.5 mr-1" />Unsuspend
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={isCaregiver ? 7 : 7} className="text-center py-8 text-gray-400 text-sm">
                  No verification requests found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  // ── Detail Dialog ──
  const renderDetailDialog = () => {
    const v = selectedVerification
    if (!v) return null

    const cfg = statusConfig[v.status] || statusConfig.pending
    const isDoctor = v.entityType === 'doctor'
    // For caregivers with multiple packages, allow switching between them
    const hasMultiplePkgs = entityVerifications.length > 1
    const displayV = hasMultiplePkgs
      ? entityVerifications.find((ev) => ev.package === activePkgTab) || v
      : v

    const docMap = new Map(displayV.documents.map((d) => [d.type, d]))

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
            {/* Package tabs for caregivers with multiple packages */}
            {hasMultiplePkgs && (
              <div className="flex gap-1.5 flex-wrap">
                {entityVerifications.map((ev) => {
                  const isActive = ev.package === activePkgTab
                  return (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setActivePkgTab(ev.package || 'all')
                        setSelectedVerification(ev)
                      }}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        isActive
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <span className={cn('inline-block w-1.5 h-1.5 rounded-full mr-1.5',
                        ev.status === 'approved' ? 'bg-green-500' : ev.status === 'rejected' ? 'bg-red-500' : ev.isSuspended ? 'bg-gray-800' : 'bg-yellow-500'
                      )} />
                      {pkgLabel(ev.package)}
                    </button>
                  )
                })}
              </div>
            )}
            {/* Suspension Banner */}
            {displayV.isSuspended && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <Ban className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Account Suspended</p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {displayV.suspensionReason || `Maximum ${MAX_ATTEMPTS} verification attempts exceeded.`}
                  </p>
                  <p className="text-xs text-red-500 mt-1">
                    User cannot re-submit documents. Admin must unsuspend the account first.
                  </p>
                </div>
              </div>
            )}

            {/* Rejection info */}
            {displayV.status === 'rejected' && !displayV.isSuspended && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Rejection Info</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {displayV.reviewNotes || 'Documents did not meet requirements.'}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Attempt {displayV.attemptCount}/{MAX_ATTEMPTS} used. {displayV.attemptsRemaining} attempt{displayV.attemptsRemaining !== 1 ? 's' : ''} remaining.
                    User can re-upload documents and resubmit.
                  </p>
                </div>
              </div>
            )}

            {/* Resubmitted banner */}
            {displayV.status === 'resubmitted' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Upload className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-blue-800">Resubmitted for Review</p>
                  <p className="text-xs text-blue-700 mt-0.5">
                    User has re-uploaded documents. Attempt {displayV.attemptCount}/{MAX_ATTEMPTS}.
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
                  <span className="text-[11px] text-gray-400">Verification Attempts{hasMultiplePkgs ? ` (${pkgLabel(displayV.package)})` : ''}</span>
                  <span className={cn(
                    'text-[11px] font-medium',
                    displayV.attemptsRemaining === 0 ? 'text-red-600' : displayV.attemptsRemaining === 1 ? 'text-amber-600' : 'text-gray-600'
                  )}>
                    Attempt {displayV.attemptCount} of {MAX_ATTEMPTS}
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                    <div key={i} className={cn(
                      'h-1.5 flex-1 rounded-full',
                      i < displayV.attemptCount
                        ? displayV.isSuspended ? 'bg-red-500' : displayV.status === 'approved' ? 'bg-green-500' : 'bg-amber-400'
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
                Uploaded Documents ({displayV.documents.length})
              </h4>
              {displayV.documents.length > 0 ? (
                <div className="space-y-1">
                  {displayV.documents.map((doc) => (
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
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          onClick={() => setOverlayImg({ url: doc.url, label: findDocLabel(displayV, doc.type) })}
                        >
                          <Eye className="w-3 h-3" />View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 py-4 text-center">No documents uploaded yet</p>
              )}
            </div>

            {/* Mandatory Documents Pending */}
            {displayV.mandatoryPending.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Mandatory Documents Pending ({displayV.mandatoryPending.length})
                </h4>
                <div className="space-y-1">
                  {displayV.mandatoryPending.map((key) => (
                    <div key={key} className="flex items-center gap-2 py-1.5 px-3 bg-red-50 rounded-lg">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm text-red-800">{findDocLabel(displayV, key)}</span>
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
                {displayV.docTypes.optional.map((dt) => {
                  const doc = docMap.get(dt.key)
                  return (
                    <div key={dt.key} className="flex items-center justify-between py-1.5 px-3 bg-gray-50/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {doc ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <div className="w-4 h-4 rounded-full border border-gray-300" />}
                        <span className="text-sm text-gray-600">{dt.label}</span>
                      </div>
                      {doc && (
                        <button
                        type="button"
                        className="text-xs text-blue-600 hover:underline"
                        onClick={() => {
                          const url = doc.url
                          if (url.startsWith('data:')) {
                            try {
                              const p = url.split(',')
                              const m = p[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
                              const b = atob(p[1])
                              const a = new Uint8Array(b.length)
                              for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i)
                              const bl = new Blob([a], { type: m })
                              const bu = URL.createObjectURL(bl)
                              window.open(bu, '_blank')
                              setTimeout(() => URL.revokeObjectURL(bu), 30000)
                            } catch { /* */ }
                          } else {
                            window.open(url, '_blank')
                          }
                        }}
                      >View</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Review Notes (if previously reviewed) */}
            {displayV.reviewNotes && displayV.status !== 'pending' && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-[11px] text-gray-400 mb-1">Admin Review Notes</p>
                <p className="text-sm text-gray-700">{displayV.reviewNotes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              {displayV.isSuspended ? (
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { setDetailOpen(false); openUnsuspend(displayV) }}>
                  <Unlock className="w-4 h-4 mr-2" />Unsuspend Account
                </Button>
              ) : (displayV.status === 'pending' || displayV.status === 'resubmitted') ? (
                <>
                  <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => { setDetailOpen(false); openReview(displayV, 'approved') }}>
                    <ShieldCheck className="w-4 h-4 mr-2" />Approve
                  </Button>
                  <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => { setDetailOpen(false); openReview(displayV, 'rejected') }}>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {displayV.attemptsRemaining <= 1 ? `Reject (Final)` : 'Reject'}
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
            </TabsTrigger>
            <TabsTrigger value="caregivers" className="gap-1.5">
              Caregivers
              {!loading && countUniqueByStatus(caregivers, 'pending', 'resubmitted') > 0 && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-yellow-500 text-white border-0">
                  {countUniqueByStatus(caregivers, 'pending', 'resubmitted')}
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
                Care Partner Verifications
                {!loading && <span className="text-sm font-normal text-gray-500 ml-2">({new Set(caregivers.map(c => c.entityId)).size} total)</span>}
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

      {/* Fullscreen image overlay */}
      {overlayImg && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOverlayImg(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 pr-10">
              <span className="text-sm text-white font-medium">{overlayImg.label}</span>
              <button
                type="button"
                className="text-xs text-blue-300 hover:text-blue-100 hover:underline shrink-0 whitespace-nowrap"
                onClick={() => {
                  const oUrl = overlayImg.url
                  if (oUrl.startsWith('data:')) {
                  try {
                    const parts = oUrl.split(',')
                    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
                    const b64 = atob(parts[1])
                    const arr = new Uint8Array(b64.length)
                    for (let i = 0; i < b64.length; i++) arr[i] = b64.charCodeAt(i)
                    const blob = new Blob([arr], { type: mime })
                    const blobUrl = URL.createObjectURL(blob)
                    window.open(blobUrl, '_blank')
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000)
                  } catch { /* */ }
                  } else {
                    window.open(oUrl, '_blank')
                  }
                }}
              >
                Open in new tab
              </button>
            </div>
            <img
              src={overlayImg.url}
              alt={overlayImg.label}
              className="w-full max-h-[85vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setOverlayImg(null)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 shadow-lg text-lg leading-none"
            >
              x
            </button>
          </div>
        </div>
      )}
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
