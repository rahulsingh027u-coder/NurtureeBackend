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
  ShieldCheck, Loader2, RefreshCw, AlertCircle, FileText, Eye, Search, UserCheck, UserX, Stethoscope, HeartPulse
} from 'lucide-react'

interface VerificationDoc {
  type: string
  url: string
  verified?: boolean
}

interface Verification {
  id: string
  entityType: 'doctor' | 'caregiver'
  entityId: string
  entityName: string
  entityPhone: string
  entitySpecialty: string
  status: 'pending' | 'in_progress' | 'approved' | 'rejected'
  package: string | null
  documents: VerificationDoc[]
  docTypes: string[]
  reviewNotes: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  createdAt: string
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const statusIcon: Record<string, React.ReactNode> = {
  pending: <AlertCircle className="w-3.5 h-3.5" />,
  in_progress: <Loader2 className="w-3.5 h-3.5" />,
  approved: <UserCheck className="w-3.5 h-3.5" />,
  rejected: <UserX className="w-3.5 h-3.5" />,
}

function formatDate(iso: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatDateShort(iso: string) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  } catch {
    return iso
  }
}

type TabValue = 'doctors' | 'caregivers'

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

  // Review dialog
  const [reviewOpen, setReviewOpen] = useState(false)
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

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

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const currentList = activeTab === 'doctors' ? doctors : caregivers
  const filteredList = searchQuery.trim()
    ? currentList.filter((v) =>
        v.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.entityPhone.includes(searchQuery)
      )
    : currentList

  const pendingCount = (list: Verification[]) => list.filter((v) => v.status === 'pending').length
  const approvedCount = (list: Verification[]) => list.filter((v) => v.status === 'approved').length
  const rejectedCount = (list: Verification[]) => list.filter((v) => v.status === 'rejected').length

  const openDetail = (v: Verification) => {
    setSelectedVerification(v)
    setDetailOpen(true)
  }

  const openReview = (v: Verification, act: 'approved' | 'rejected') => {
    setSelectedVerification(v)
    setAction(act)
    setReviewNotes(v.reviewNotes || '')
    setReviewOpen(true)
  }

  const handleSubmitReview = async () => {
    if (!selectedVerification || !action) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/verification/${selectedVerification.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          reviewNotes: reviewNotes || null,
          reviewedBy: 'admin',
        }),
      })
      if (res.ok) {
        toast({
          title: action === 'approved' ? 'Verification Approved' : 'Verification Rejected',
          description: `${selectedVerification.entityName} has been ${action}`,
        })
        setReviewOpen(false)
        setDetailOpen(false)
        await fetchVerifications(activeTab)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update verification', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const renderSummaryCards = (
    list: Verification[],
    label: string,
    icon: React.ReactNode
  ) => [
    { label: 'Pending Review', count: pendingCount(list), color: 'bg-yellow-100 text-yellow-600', icon: <AlertCircle className="w-5 h-5" /> },
    { label: 'Approved', count: approvedCount(list), color: 'bg-green-100 text-green-600', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Rejected', count: rejectedCount(list), color: 'bg-red-100 text-red-600', icon: <UserX className="w-5 h-5" /> },
  ].map((card) => (
    <Card key={card.label} className="bg-white rounded-xl shadow-sm border-0">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', card.color)}>
          {card.icon}
        </div>
        <div>
          {loading ? (
            <Skeleton className="h-7 w-8" />
          ) : (
            <p className="text-2xl font-bold text-gray-900">{card.count}</p>
          )}
          <p className="text-xs text-gray-500">{card.label}</p>
        </div>
      </CardContent>
    </Card>
  ))

  const renderTable = (items: Verification[], entityType: 'doctor' | 'caregiver') => (
    <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Specialty</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Package</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Docs</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Submitted</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Actions</TableHead>
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
            items.map((v) => (
              <TableRow key={v.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold',
                      entityType === 'doctor' ? 'bg-blue-500' : 'bg-orange-500'
                    )}>
                      {v.entityName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{v.entityName}</p>
                      <p className="text-[11px] text-gray-500">{v.entityPhone || '—'}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-700">{v.entitySpecialty || '—'}</TableCell>
                <TableCell className="text-sm text-gray-700 capitalize">{v.package || '—'}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[11px] bg-gray-100 text-gray-700">
                    {v.documents.length} uploaded
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn('text-[11px] capitalize flex items-center gap-1 w-fit', statusColor[v.status] || 'bg-gray-100 text-gray-800')}>
                    {statusIcon[v.status]}
                    {v.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{formatDateShort(v.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[11px] text-gray-600 hover:text-blue-600 hover:bg-blue-50 h-7 px-2"
                      onClick={() => openDetail(v)}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                    {v.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white h-7 px-2.5"
                          onClick={() => openReview(v, 'approved')}
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-[11px] border-red-200 text-red-600 hover:bg-red-50 h-7 px-2.5"
                          onClick={() => openReview(v, 'rejected')}
                        >
                          <UserX className="w-3.5 h-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
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

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Tabs: Doctors / Caregivers */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as TabValue)}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="doctors" className="gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              Doctors
              {!loading && pendingCount(doctors) > 0 && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-yellow-500 text-white border-0">
                  {pendingCount(doctors)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="caregivers" className="gap-1.5">
              <HeartPulse className="w-3.5 h-3.5" />
              Caregivers
              {!loading && pendingCount(caregivers) > 0 && (
                <Badge className="ml-1 h-4 min-w-4 px-1 text-[10px] bg-yellow-500 text-white border-0">
                  {pendingCount(caregivers)}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="Search by name or phone..."
                className="h-8 pl-8 text-xs w-full sm:w-56"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5 h-8"
              onClick={fetchAll}
              disabled={loading}
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Doctors Tab */}
        <TabsContent value="doctors" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {renderSummaryCards(doctors, 'Doctors', <Stethoscope className="w-5 h-5" />)}
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

        {/* Caregivers Tab */}
        <TabsContent value="caregivers" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {renderSummaryCards(caregivers, 'Caregivers', <HeartPulse className="w-5 h-5" />)}
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

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedVerification?.entityType === 'doctor' ? (
                <Stethoscope className="w-5 h-5 text-blue-600" />
              ) : (
                <HeartPulse className="w-5 h-5 text-orange-600" />
              )}
              Verification Details
            </DialogTitle>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-4 py-2">
              {/* Entity info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-semibold',
                    selectedVerification.entityType === 'doctor' ? 'bg-blue-500' : 'bg-orange-500'
                  )}>
                    {selectedVerification.entityName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-900">{selectedVerification.entityName}</p>
                    <p className="text-sm text-gray-500">{selectedVerification.entityPhone || 'No phone'}</p>
                  </div>
                  <Badge variant="secondary" className={cn('ml-auto text-xs capitalize', statusColor[selectedVerification.status])}>
                    {selectedVerification.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Type</span>
                    <p className="font-medium capitalize text-gray-900">{selectedVerification.entityType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Specialty</span>
                    <p className="font-medium text-gray-900">{selectedVerification.entitySpecialty || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Package</span>
                    <p className="font-medium capitalize text-gray-900">{selectedVerification.package || '—'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Submitted</span>
                    <p className="font-medium text-gray-900">{formatDate(selectedVerification.createdAt)}</p>
                  </div>
                </div>
                {selectedVerification.reviewedAt && (
                  <div className="text-sm">
                    <span className="text-gray-500">Reviewed on</span>
                    <p className="font-medium text-gray-900">{formatDate(selectedVerification.reviewedAt)} {selectedVerification.reviewedBy ? `by ${selectedVerification.reviewedBy}` : ''}</p>
                  </div>
                )}
                {selectedVerification.reviewNotes && (
                  <div className="text-sm">
                    <span className="text-gray-500">Review Notes</span>
                    <p className="font-medium text-gray-900 mt-0.5">{selectedVerification.reviewNotes}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Documents ({selectedVerification.documents.length})
                </h4>
                {selectedVerification.docTypes.map((docType) => {
                  const doc = selectedVerification.documents.find((d) => d.type === docType)
                  return (
                    <div key={docType} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-2 h-2 rounded-full',
                          doc ? (doc.verified ? 'bg-green-500' : 'bg-yellow-500') : 'bg-gray-300'
                        )} />
                        <span className="text-sm text-gray-700">{docType}</span>
                      </div>
                      {doc ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Not uploaded</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              {selectedVerification.status === 'pending' && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setDetailOpen(false)
                      openReview(selectedVerification, 'approved')
                    }}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setDetailOpen(false)
                      openReview(selectedVerification, 'rejected')
                    }}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve / Reject Dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {action === 'approved' ? (
                <ShieldCheck className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {action === 'approved' ? 'Approve Verification' : 'Reject Verification'}
            </DialogTitle>
          </DialogHeader>
          {selectedVerification && (
            <div className="space-y-4 py-2">
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">Name</span>
                  <span className="text-sm font-medium text-gray-900">{selectedVerification.entityName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">Type</span>
                  <Badge variant="secondary" className={cn(
                    'text-[11px] capitalize',
                    selectedVerification.entityType === 'doctor' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                  )}>
                    {selectedVerification.entityType}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">Package</span>
                  <span className="text-sm text-gray-700 capitalize">{selectedVerification.package || '—'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Review Notes</Label>
                <Textarea
                  placeholder={action === 'approved' ? 'Optional approval notes...' : 'Reason for rejection...'}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button
              className={cn(
                'text-white',
                action === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              )}
              onClick={handleSubmitReview}
              disabled={submitting}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {action === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}