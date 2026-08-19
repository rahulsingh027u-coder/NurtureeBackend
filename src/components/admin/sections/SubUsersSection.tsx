'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { Plus, Pencil, Ban, Loader2, ShieldCheck } from 'lucide-react'

const PERMISSION_MODULES = [
  'Dashboard', 'Child Care', 'Elder Care', 'Doctors', 'Doctor Analytics',
  'Patients', 'Bookings', 'Prescriptions', 'Care Partners', 'SubUsers',
  'Commission', 'Revenue', 'Analytics', 'Verification', 'Services', 'Profile',
] as const

const BRANCH_OPTIONS = [
  'Child Care', 'Elder Care', 'Doctors', 'Doctor Analytics', 'Bookings', 'Patients', 'Revenue', 'Analytics', 'Commission',
] as const

interface SubUser {
  id: string
  name: string
  email: string
  role: string
  permissions: string[]
  branches: string[]
  status: string
}

const roleBadge: Record<string, string> = {
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-blue-100 text-blue-700',
  staff: 'bg-gray-100 text-gray-700',
  viewer: 'bg-purple-100 text-purple-700',
}

const emptyForm = {
  name: '',
  email: '',
  password: '',
  permissions: [] as string[],
  branches: [] as string[],
}

export function SubUsersSection() {
  const { toast } = useToast()
  const [subUsers, setSubUsers] = useState<SubUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedUser, setSelectedUser] = useState<SubUser | null>(null)

  const [createForm, setCreateForm] = useState({ ...emptyForm })
  const [editForm, setEditForm] = useState({ ...emptyForm })

  useEffect(() => {
    fetchSubUsers()
  }, [])

  const fetchSubUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subusers')
      if (res.ok) {
        const data = await res.json()
        setSubUsers(Array.isArray(data) ? data : data.data || [])
      } else {
        toast({ title: 'Error', description: 'Failed to fetch sub users', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast({ title: 'Error', description: 'Please fill required fields (Name, Email, Password)', variant: 'destructive' })
      return
    }
    if (createForm.permissions.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one permission', variant: 'destructive' })
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/subusers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        toast({ title: 'Sub User Created', description: `${createForm.name} has been added successfully` })
        setCreateOpen(false)
        setCreateForm({ ...emptyForm })
        fetchSubUsers()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to create sub user', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setCreating(false)
    }
  }

  const handleEdit = (user: SubUser) => {
    setSelectedUser(user)
    setEditForm({
      name: user.name,
      email: user.email,
      password: '',
      permissions: [...user.permissions],
      branches: [...user.branches],
    })
    setEditOpen(true)
  }

  const [saving, setSaving] = useState(false)

  const handleEditSave = async () => {
    if (!selectedUser) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: editForm.name,
        email: editForm.email,
        permissions: editForm.permissions,
        branches: editForm.branches,
      }
      if (editForm.password) payload.password = editForm.password
      const res = await fetch(`/api/subusers/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast({ title: 'Sub User Updated', description: `${editForm.name} has been updated successfully` })
        setEditOpen(false)
        setSelectedUser(null)
        fetchSubUsers()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to update', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (user: SubUser) => {
    const newStatus = user.status === 'active' ? false : true
    try {
      const res = await fetch(`/api/subusers/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      })
      if (res.ok) {
        toast({
          title: newStatus ? 'User Activated' : 'User Deactivated',
          description: `${user.name} has been ${newStatus ? 'activated' : 'deactivated'}`,
        })
        fetchSubUsers()
      } else {
        toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    }
  }

  const togglePermission = (form: typeof createForm, setForm: (f: typeof createForm) => void, perm: string) => {
    const perms = form.permissions.includes(perm)
      ? form.permissions.filter(p => p !== perm)
      : [...form.permissions, perm]
    setForm({ ...form, permissions: perms })
  }

  const toggleBranch = (form: typeof createForm, setForm: (f: typeof createForm) => void, branch: string) => {
    const branches = form.branches.includes(branch)
      ? form.branches.filter(b => b !== branch)
      : [...form.branches, branch]
    setForm({ ...form, branches })
  }

  const renderPermissionBadges = (permissions: unknown) => {
    const perms = Array.isArray(permissions) ? permissions : []
    if (perms.length === 0) return <span className="text-gray-400 text-xs">None</span>
    const maxVisible = 4
    const visible = perms.slice(0, maxVisible)
    const remaining = perms.length - maxVisible
    return (
      <div className="flex flex-wrap gap-1">
        {visible.map(p => (
          <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border border-blue-100">
            {p}
          </Badge>
        ))}
        {remaining > 0 && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600">
            +{remaining} more
          </Badge>
        )}
      </div>
    )
  }

  const renderBranchBadges = (branches: unknown) => {
    const br = Array.isArray(branches) ? branches : []
    if (br.length === 0) return <span className="text-gray-400 text-xs">None</span>
    return (
      <div className="flex flex-wrap gap-1">
        {br.map(b => (
          <Badge key={b} variant="secondary" className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-600">
            {b}
          </Badge>
        ))}
      </div>
    )
  }

  const PermissionCheckboxGrid = ({
    form,
    setForm,
  }: {
    form: typeof createForm
    setForm: (f: typeof createForm) => void
  }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {PERMISSION_MODULES.map(perm => (
        <label
          key={perm}
          className="flex items-center gap-2 rounded-lg border border-gray-200 p-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <Checkbox
            checked={form.permissions.includes(perm)}
            onCheckedChange={() => togglePermission(form, setForm, perm)}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <span className="text-sm text-gray-700 select-none">{perm}</span>
        </label>
      ))}
    </div>
  )

  const BranchCheckboxList = ({
    form,
    setForm,
  }: {
    form: typeof createForm
    setForm: (f: typeof createForm) => void
  }) => (
    <div className="space-y-2">
      {BRANCH_OPTIONS.map(branch => (
        <label
          key={branch}
          className="flex items-center gap-2 rounded-lg border border-gray-200 p-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          <Checkbox
            checked={form.branches.includes(branch)}
            onCheckedChange={() => toggleBranch(form, setForm, branch)}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <span className="text-sm text-gray-700 select-none">{branch}</span>
        </label>
      ))}
    </div>
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Sub Users Table */}
      <Card className="bg-white rounded-xl shadow-sm border-0">
        <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Sub Users
          </CardTitle>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Create Sub User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Sub User</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 py-2">
                {/* Basic Info */}
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">Basic Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name *</Label>
                      <Input placeholder="Enter full name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" placeholder="Enter email address" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <Input type="password" placeholder="Enter password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Permissions</Label>
                  <PermissionCheckboxGrid form={createForm} setForm={setCreateForm} />
                </div>

                {/* Branches */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Branches</Label>
                  <BranchCheckboxList form={createForm} setForm={setCreateForm} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create User
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Email</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Role</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Permissions</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Branches</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : subUsers.length > 0 ? (
                  subUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-gray-50/50">
                      <TableCell className="text-sm font-medium text-gray-900">{u.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn('text-[11px] capitalize', roleBadge[u.role] || 'bg-gray-100 text-gray-700')}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px]">{renderPermissionBadges(u.permissions)}</TableCell>
                      <TableCell className="max-w-[180px]">{renderBranchBadges(u.branches)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={cn(
                          'text-[11px] capitalize',
                          u.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        )}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                            onClick={() => handleEdit(u)}
                          >
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className={cn(
                              'text-xs',
                              u.status === 'active'
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                            )}
                            onClick={() => handleDeactivate(u)}
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-sm">
                      No sub users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Sub User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sub User</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            {/* Basic Info */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Basic Information</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input placeholder="Enter full name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input type="email" placeholder="Enter email address" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></Label>
                <Input type="password" placeholder="Enter new password" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Permissions</Label>
              <PermissionCheckboxGrid form={editForm} setForm={setEditForm} />
            </div>

            {/* Branches */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Branches</Label>
              <BranchCheckboxList form={editForm} setForm={setEditForm} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEditSave} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}