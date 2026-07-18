'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { ShieldCheck, Loader2, RefreshCw, AlertCircle } from 'lucide-react'

interface Verification {
  id: string
  entityType: 'doctor' | 'caregiver'
  entityName: string
  package: string
  status: 'pending' | 'in_progress' | 'approved' | 'rejected'
  submittedDate: string
}

const entityTypeColor: Record<string, string> = {
  doctor: 'bg-teal-100 text-teal-700',
  caregiver: 'bg-orange-100 text-orange-700',
}

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export function VerificationSection() {
  const { toast } = useToast()
  const [allVerifications, setAllVerifications] = useState<Verification[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null)
  const [action, setAction] = useState<'approved' | 'rejected' | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchVerifications()
  }, [])

  const fetchVerifications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/verification')
      if (res.ok) {
        const data = await res.json()
        setAllVerifications(Array.isArray(data) ? data : data.verifications || [])
      } else {
        toast({ title: 'Error', description: 'Failed to fetch verifications', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const pendingVerifications = allVerifications.filter((v) => v.status === 'pending')

  const openDialog = (verification: Verification, act: 'approved' | 'rejected') => {
    setSelectedVerification(verification)
    setAction(act)
    setReviewNotes('')
    setDialogOpen(true)
  }

  const handleSubmitReview = async () => {
    if (!selectedVerification || !action) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/verification/${selectedVerification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action,
          reviewNotes,
          reviewedBy: 'admin-id',
        }),
      })
      if (res.ok) {
        toast({
          title: action === 'approved' ? 'Verification Approved' : 'Verification Rejected',
          description: `${selectedVerification.entityName} has been ${action}`,
        })
        setDialogOpen(false)
        fetchVerifications()
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

  const renderTable = (items: Verification[], showActions: boolean) => (
    <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Type</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Package</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Submitted</TableHead>
            {showActions && (
              <TableHead className="text-xs font-semibold uppercase text-gray-500">Actions</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: showActions ? 6 : 5 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : items.length > 0 ? (
            items.map((v) => (
              <TableRow key={v.id} className="hover:bg-gray-50/50">
                <TableCell>
                  <Badge variant="secondary" className={cn('text-[11px] capitalize', entityTypeColor[v.entityType] || 'bg-gray-100 text-gray-800')}>
                    {v.entityType}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-medium text-gray-900">{v.entityName}</TableCell>
                <TableCell className="text-sm text-gray-700 capitalize">{v.package}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn('text-[11px] capitalize', statusColor[v.status] || 'bg-gray-100 text-gray-800')}>
                    {v.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{v.submittedDate}</TableCell>
                {showActions && (
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        className="text-[11px] bg-green-600 hover:bg-green-700 text-white h-7 px-2.5"
                        onClick={() => openDialog(v, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] border-red-200 text-red-600 hover:bg-red-50 h-7 px-2.5"
                        onClick={() => openDialog(v, 'rejected')}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="text-center py-8 text-gray-400 text-sm">
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
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-8" /> : <p className="text-2xl font-bold text-gray-900">{pendingVerifications.length}</p>}
              <p className="text-xs text-gray-500">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-8" /> : <p className="text-2xl font-bold text-gray-900">{allVerifications.filter((v) => v.status === 'approved').length}</p>}
              <p className="text-xs text-gray-500">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-8" /> : <p className="text-2xl font-bold text-gray-900">{allVerifications.filter((v) => v.status === 'rejected').length}</p>}
              <p className="text-xs text-gray-500">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1.5"
            onClick={fetchVerifications}
            disabled={loading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        <TabsContent value="pending">
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">Pending Verifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderTable(pendingVerifications, true)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card className="bg-white rounded-xl shadow-sm border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">All Verifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {renderTable(allVerifications, false)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve / Reject Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  <Badge variant="secondary" className={cn('text-[11px] capitalize', entityTypeColor[selectedVerification.entityType])}>
                    {selectedVerification.entityType}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20">Package</span>
                  <span className="text-sm text-gray-700 capitalize">{selectedVerification.package}</span>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
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
