'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Mail, RefreshCw, Users, MapPin } from 'lucide-react'

interface SubUser {
  id: string
  name: string
  email: string
  permissions: string[]
  activeBranches: string[]
  status: 'active' | 'inactive'
}

const MAX_VISIBLE_CHIPS = 4

export function ProfileSection() {
  const { toast } = useToast()
  const user = useAppStore((s) => s.user)
  const [subUsers, setSubUsers] = useState<SubUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubUsers()
  }, [])

  const fetchSubUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subusers')
      if (res.ok) {
        const data = await res.json()
        setSubUsers(Array.isArray(data) ? data : data.subusers || [])
      } else {
        toast({ title: 'Error', description: 'Failed to fetch sub users', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const initials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const permissionColor = (p: string) => {
    const map: Record<string, string> = {
      dashboard: 'bg-gray-100 text-gray-700',
      child_care: 'bg-pink-100 text-pink-700',
      elder_care: 'bg-purple-100 text-purple-700',
      doctors: 'bg-blue-100 text-blue-700',
      patients: 'bg-blue-100 text-blue-700',
      bookings: 'bg-indigo-100 text-indigo-700',
      prescriptions: 'bg-cyan-100 text-cyan-700',
      caregivers: 'bg-amber-100 text-amber-700',
      subusers: 'bg-orange-100 text-orange-700',
      commission: 'bg-blue-100 text-blue-700',
      analytics: 'bg-lime-100 text-lime-700',
      verification: 'bg-yellow-100 text-yellow-700',
      services: 'bg-rose-100 text-rose-700',
      profile: 'bg-slate-100 text-slate-700',
    }
    return map[p] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Admin Profile Card */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-900">Admin Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-semibold">
                {user ? initials(user.name) : 'AD'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold text-gray-900">{user?.name || 'Admin User'}</p>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[11px] capitalize',
                    user?.role === 'super_admin' ? 'bg-blue-100 text-blue-700' : 'bg-blue-100 text-blue-700'
                  )}
                >
                  {user?.role === 'super_admin' ? 'Super Admin' : 'Sub User'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email || 'admin@nurturee.com'}</span>
              </div>
              {user?.activeBranches && user.activeBranches.length > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{user.activeBranches.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sub Users Under Branch */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Sub Users Under Your Branch
            </CardTitle>
            <p className="text-xs text-gray-400">
              This shows all sub users assigned under your admin branch and their access permissions.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5"
            onClick={fetchSubUsers}
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
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Email</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Permissions</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Branches</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 5 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : subUsers.length > 0 ? (
                  subUsers.map((su) => (
                    <TableRow key={su.id} className="hover:bg-gray-50/50">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-blue-50 text-blue-700 text-[10px] font-semibold">
                              {initials(su.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-gray-900">{su.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{su.email}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {(su.permissions || []).slice(0, MAX_VISIBLE_CHIPS).map((p) => (
                            <Badge key={p} variant="secondary" className={cn('text-[10px] capitalize', permissionColor(p))}>
                              {p.replace('_', ' ')}
                            </Badge>
                          ))}
                          {(su.permissions || []).length > MAX_VISIBLE_CHIPS && (
                            <Badge variant="secondary" className="text-[10px] bg-gray-100 text-gray-600">
                              +{(su.permissions || []).length - MAX_VISIBLE_CHIPS} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1">
                          {(su.activeBranches || []).map((b) => (
                            <Badge key={b} variant="secondary" className="text-[10px] bg-blue-50 text-blue-700">
                              {b}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-2 h-2 rounded-full', su.status === 'active' ? 'bg-blue-500' : 'bg-red-500')} />
                          <span className={cn('text-sm capitalize', su.status === 'active' ? 'text-blue-700' : 'text-red-700')}>
                            {su.status}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-400 text-sm">
                      No sub users found under your branch
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
