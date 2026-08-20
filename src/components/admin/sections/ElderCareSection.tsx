'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Plus, UserCheck, CalendarDays, Users, Loader2 } from 'lucide-react'

const statusColor: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800', completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

interface CareBooking { id: string; bookingId: string; patientName: string; patientUhid?: string; caregiverId?: string; caregiverName?: string; status: string; date: string; startTime: string }
interface Caregiver { id: string; name: string; phone: string; specialty: string; isAvailable: boolean; experience: number }

export function ElderCareSection() {
  const { toast } = useToast()
  const [bookings, setBookings] = useState<CareBooking[]>([])
  const [caregivers, setCaregivers] = useState<Caregiver[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<CareBooking | null>(null)
  const [creating, setCreating] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedCaregiver, setSelectedCaregiver] = useState('')
  const [form, setForm] = useState({ patientName: '', phone: '', service: '', date: '', time: '', notes: '' })

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [bRes, cRes] = await Promise.all([fetch('/api/bookings?type=elder_care'), fetch('/api/caregivers?specialty=elder_care')])
      if (bRes.ok) { const d = await bRes.json(); setBookings(Array.isArray(d) ? d : d?.bookings || []) }
      if (cRes.ok) { const d = await cRes.json(); setCaregivers(Array.isArray(d) ? d : d?.data || []) }
    } catch { toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const handleCreate = async () => {
    if (!form.patientName || !form.phone || !form.date) { toast({ title: 'Error', description: 'Please fill required fields', variant: 'destructive' }); return }
    setCreating(true)
    try {
      const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, bookingType: 'elder_care' }) })
      if (res.ok) { toast({ title: 'Booking Created' }); setCreateOpen(false); setForm({ patientName: '', phone: '', service: '', date: '', time: '', notes: '' }); fetchData() }
      else { const d = await res.json(); toast({ title: 'Error', description: d.error || 'Failed', variant: 'destructive' }) }
    } catch { toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' }) }
    finally { setCreating(false) }
  }

  const handleAssign = async () => {
    if (!selectedBooking || !selectedCaregiver) return
    setAssigning(true)
    try {
      const res = await fetch(`/api/bookings/${selectedBooking.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ caregiverId: selectedCaregiver }) })
      if (res.ok) { toast({ title: 'Care Partner Assigned' }); setAssignOpen(false); setSelectedCaregiver(''); fetchData() }
      else toast({ title: 'Error', description: 'Failed to assign', variant: 'destructive' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setAssigning(false) }
  }

  const availableCaregivers = caregivers.filter(c => c.isAvailable)
  const activeAssignments = bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status)).length

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Bookings', count: bookings.length, icon: CalendarDays, color: 'bg-orange-100 text-orange-600' },
          { label: 'Active Assignments', count: activeAssignments, icon: UserCheck, color: 'bg-blue-100 text-blue-600' },
          { label: 'Available Care Partners', count: availableCaregivers.length, icon: Users, color: 'bg-blue-100 text-blue-600' },
        ].map(c => (
          <Card key={c.label} className="bg-white rounded-xl shadow-sm border-0">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${c.color} flex items-center justify-center`}><c.icon className="w-5 h-5" /></div>
              <div>
                {loading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold text-gray-900">{c.count}</p>}
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold text-gray-900">Elder Care Bookings</CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild><Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Plus className="w-4 h-4" /> Create Booking</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>Create Elder Care Booking</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label>Patient Name *</Label><Input placeholder="Enter patient name" value={form.patientName} onChange={e => setForm({ ...form, patientName: e.target.value })} /></div>
                <div className="space-y-2"><Label>Phone *</Label><Input placeholder="Enter phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>Service</Label>
                  <Select value={form.service} onValueChange={v => setForm({ ...form, service: v })}>
                    <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="companionship">Elderly Companionship</SelectItem>
                      <SelectItem value="medical_attendant">Medical Attendant</SelectItem>
                      <SelectItem value="full_time">Full-Time Care Partner</SelectItem>
                      <SelectItem value="dementia">Dementia/Alzheimer&apos;s Care</SelectItem>
                      <SelectItem value="post_hospital">Post-Hospitalisation Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Date *</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                  <div className="space-y-2"><Label>Time</Label>
                    <Select value={form.time} onValueChange={v => setForm({ ...form, time: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {['08:00 AM','09:00 AM','10:00 AM','11:00 AM','12:00 PM','02:00 PM','04:00 PM','06:00 PM'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2"><Label>Special Needs / Notes</Label><Textarea placeholder="Any special requirements..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate} disabled={creating}>{creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Booking ID</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Patient</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Care Partner</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? Array.from({ length: 4 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>)}</TableRow>)
                : bookings.length > 0 ? bookings.map(b => (
                  <TableRow key={b.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-mono text-xs text-blue-700 font-medium">{b.bookingId}</TableCell>
                    <TableCell><p className="text-sm font-medium">{b.patientName}</p>{b.patientUhid && <p className="text-xs text-gray-400">{b.patientUhid}</p>}</TableCell>
                    <TableCell className="text-sm text-gray-700">{b.caregiverName || <span className="text-gray-400">Unassigned</span>}</TableCell>
                    <TableCell><Badge variant="secondary" className={cn('text-[11px] capitalize', statusColor[b.status] || '')}>{b.status.replace('_',' ')}</Badge></TableCell>
                    <TableCell className="text-sm text-gray-600">{b.date}</TableCell>
                    <TableCell>
                      {!b.caregiverId && !['cancelled','completed'].includes(b.status) && (
                        <Button size="sm" variant="outline" className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => { setSelectedBooking(b); setAssignOpen(true) }}>
                          <UserCheck className="w-3 h-3 mr-1" /> Assign
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400 text-sm">No elder care bookings found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold text-gray-900">Elder Care Care Partners</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          : caregivers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {caregivers.map(c => (
                <div key={c.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className={cn('w-2 h-2 rounded-full', c.isAvailable ? 'bg-blue-500' : 'bg-gray-400')} />
                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{c.name}</p><p className="text-xs text-gray-500">{c.experience} yrs exp · {c.phone}</p></div>
                  <Badge variant="secondary" className={cn('text-[11px]', c.isAvailable ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>{c.isAvailable ? 'Available' : 'Unavailable'}</Badge>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-gray-400 text-sm py-6">No elder care care partners</p>}
        </CardContent>
      </Card>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Assign Care Partner</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600">Assign to <span className="font-mono text-blue-700">{selectedBooking?.bookingId}</span> — <span className="font-medium">{selectedBooking?.patientName}</span></p>
          <Select value={selectedCaregiver} onValueChange={setSelectedCaregiver}>
            <SelectTrigger><SelectValue placeholder="Select care partner" /></SelectTrigger>
            <SelectContent>{availableCaregivers.map(c => <SelectItem key={c.id} value={c.id}>{c.name} — {c.experience} yrs</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleAssign} disabled={assigning || !selectedCaregiver}>{assigning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Assign</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}