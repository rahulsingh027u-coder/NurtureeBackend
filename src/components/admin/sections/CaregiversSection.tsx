'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
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
import { Plus, Check, X, Star, Loader2, UserCog, Phone, Mail, Award } from 'lucide-react'

interface Caregiver {
  id: string
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

const specialtyBadge: Record<string, string> = {
  child_care: 'bg-pink-100 text-pink-700',
  elder_care: 'bg-orange-100 text-orange-700',
}

const specialtyLabel: Record<string, string> = {
  child_care: 'Child Care',
  elder_care: 'Elder Care',
}

export function CaregiversSection() {
  const { toast } = useToast()
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Filters
  const [specialtyFilter, setSpecialtyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [verifiedFilter, setVerifiedFilter] = useState('all')

  // Form
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    specialty: '',
    experience: '',
    qualifications: '',
  })

  useEffect(() => {
    fetchCaregivers()
  }, [])

  const fetchCaregivers = async (specialty?: string, available?: string, verified?: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (specialty && specialty !== 'all') params.set('specialty', specialty)
      if (available && available !== 'all') params.set('available', available === 'available' ? 'true' : 'false')
      if (verified && verified !== 'all') params.set('verified', verified === 'verified' ? 'true' : 'false')
      const res = await fetch(`/api/caregivers?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setCaregivers(Array.isArray(data) ? data : data.caregivers || [])
      } else {
        toast({ title: 'Error', description: 'Failed to fetch caregivers', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCaregivers(
      specialtyFilter,
      statusFilter,
      verifiedFilter
    )
  }, [specialtyFilter, statusFilter, verifiedFilter])

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
        body: JSON.stringify({
          ...form,
          experience: form.experience ? Number(form.experience) : 0,
        }),
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
          <Star
            key={i}
            className={cn(
              'w-3.5 h-3.5',
              i < Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
            )}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
      </div>
    )
  }

  const VerificationIcon = ({ verified }: { verified: boolean | undefined }) => {
    if (verified) {
      return <Check className="w-4 h-4 text-green-600" />
    }
    return <X className="w-4 h-4 text-red-400" />
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Caregivers Table */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <UserCog className="w-4 h-4 text-emerald-600" />
            Caregivers
          </CardTitle>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Add Caregiver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Caregiver</DialogTitle>
              </DialogHeader>
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
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Caregiver
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {/* Filter Row */}
          <div className="px-4 pb-3 pt-1 flex flex-wrap items-center gap-3 border-b border-gray-100">
            <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
              <SelectTrigger className="w-[150px] h-8 text-sm">
                <SelectValue placeholder="Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="child_care">Child Care</SelectItem>
                <SelectItem value="elder_care">Elder Care</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="unavailable">Unavailable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="Verified" />
              </SelectTrigger>
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
                    <TableRow key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-16" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : caregivers.length > 0 ? (
                  caregivers.map((c) => (
                    <TableRow key={c.id} className="hover:bg-gray-50/50">
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
                        <Badge variant="secondary" className={cn(
                          'text-[11px]',
                          c.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>
                          {c.isAvailable ? 'Available' : 'Unavailable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => {
                            toast({ title: 'Caregiver Profile', description: `Viewing profile for ${c.name}` })
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-400 text-sm">
                      No caregivers found
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