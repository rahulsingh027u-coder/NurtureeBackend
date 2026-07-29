'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { IndianRupee, TrendingUp, Wallet, Clock, RefreshCw, XCircle } from 'lucide-react'

interface CommissionEntry {
  id: string
  doctorName: string
  bookingCount: number
  totalRevenue: number
  commissionRate: number
  commissionAmount: number
  doctorEarnings: number
  paymentStatus: 'paid' | 'pending' | 'overdue'
}

interface CommissionSummary {
  totalCommission: number
  paidCommission: number
  pendingCommission: number
  overdueCommission: number
}

const statusColor: Record<string, string> = {
  paid: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
}

export function CommissionSection() {
  const { toast } = useToast()
  const [commissions, setCommissions] = useState<CommissionEntry[]>([])
  const [summary, setSummary] = useState<CommissionSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCommissions()
  }, [])

  const fetchCommissions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/commission')
      if (res.ok) {
        const data = await res.json()
        setCommissions(Array.isArray(data.commissions) ? data.commissions : [])
        setSummary(data.summary || null)
      } else {
        toast({ title: 'Error', description: 'Failed to fetch commission data', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const totalRevenue = commissions.reduce((sum, c) => sum + c.totalRevenue, 0)

  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString('en-IN')}`

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>}
              <p className="text-xs text-gray-500">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.totalCommission ?? 0)}</p>}
              <p className="text-xs text-gray-500">Platform Commission</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.paidCommission ?? 0)}</p>}
              <p className="text-xs text-gray-500">Commission Paid</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.pendingCommission ?? 0)}</p>}
              <p className="text-xs text-gray-500">Commission Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-16" /> : <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.overdueCommission ?? 0)}</p>}
              <p className="text-xs text-gray-500">Commission Overdue</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission Table */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">Commission Breakdown</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5"
            onClick={fetchCommissions}
            disabled={loading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Doctor Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-right">Bookings</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-right">Total Revenue</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-right">Rate (%)</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-right">Commission</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500 text-right">Doctor Earnings</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : commissions.length > 0 ? (
                  commissions.map((c) => (
                    <TableRow key={c.id} className="hover:bg-gray-50/50">
                      <TableCell className="text-sm font-medium text-gray-900">{c.doctorName}</TableCell>
                      <TableCell className="text-sm text-gray-700 text-right">{c.bookingCount}</TableCell>
                      <TableCell className="text-sm text-gray-700 text-right font-mono">{formatCurrency(c.totalRevenue)}</TableCell>
                      <TableCell className="text-sm text-gray-700 text-right">{c.commissionRate}%</TableCell>
                      <TableCell className="text-sm text-blue-700 text-right font-medium font-mono">{formatCurrency(c.commissionAmount)}</TableCell>
                      <TableCell className="text-sm text-gray-700 text-right font-mono">{formatCurrency(c.doctorEarnings)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px] capitalize', statusColor[c.paymentStatus] || 'bg-gray-100 text-gray-800')}>
                          {c.paymentStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                      No commission data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
