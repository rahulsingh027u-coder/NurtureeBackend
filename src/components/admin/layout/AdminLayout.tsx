'use client'

import { useAppStore, type Section, type UserPermissions } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Heart, LayoutDashboard, Baby, Users, Stethoscope, FileText, CalendarDays,
  UserCog, DollarSign, BarChart3, ShieldCheck, Package, LogOut, ChevronLeft,
  ClipboardList, UserCircle
} from 'lucide-react'

interface NavItem {
  id: Section
  label: string
  icon: React.ElementType
  permission: keyof UserPermissions
  group?: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard' },
  { id: 'child_care', label: 'Child Care', icon: Baby, permission: 'child_care', group: 'Care Services' },
  { id: 'elder_care', label: 'Elder Care', icon: Users, permission: 'elder_care' },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope, permission: 'doctors', group: 'Management' },
  { id: 'patients', label: 'Patients', icon: ClipboardList, permission: 'patients' },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays, permission: 'bookings' },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText, permission: 'prescriptions' },
  { id: 'caregivers', label: 'Caregivers', icon: UserCircle, permission: 'caregivers' },
  { id: 'subusers', label: 'Sub Users', icon: UserCog, permission: 'subusers', group: 'Admin' },
  { id: 'commission', label: 'Commission & Revenue', icon: DollarSign, permission: 'commission' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics' },
  { id: 'verification', label: 'Verifications', icon: ShieldCheck, permission: 'verification' },
  { id: 'services', label: 'Service Catalog', icon: Package, permission: 'services' },
  { id: 'profile', label: 'My Profile', icon: UserCog, permission: 'profile' },
]

export function Sidebar() {
  const { activeSection, setActiveSection, user, logout, sidebarOpen, setSidebarOpen } = useAppStore()
  const permissions = user?.permissions

  const visibleItems = navItems.filter(item => permissions?.[item.permission])

  const groupedItems: { group: string; items: NavItem[] }[] = []
  let currentGroup = ''
  for (const item of visibleItems) {
    const g = item.group || item.id
    if (g !== currentGroup) {
      currentGroup = g
      groupedItems.push({ group: g, items: [item] })
    } else {
      groupedItems[groupedItems.length - 1].items.push(item)
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg leading-tight">Nurturee</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Admin Portal</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <div className="px-3 space-y-1">
            {groupedItems.map((group, gi) => (
              <div key={group.group}>
                {gi > 0 && group.group !== 'dashboard' && (
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-3 pt-4 pb-1">
                    {group.group}
                  </p>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeSection === item.id
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn(
                        'w-full justify-start gap-3 h-10 px-3 font-normal text-sm',
                        isActive && 'bg-emerald-50 text-emerald-700 font-medium hover:bg-emerald-100 hover:text-emerald-700'
                      )}
                      onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }}
                    >
                      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-emerald-600' : 'text-gray-500')} />
                      {item.label}
                    </Button>
                  )
                })}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* User & Logout */}
        <div className="border-t border-gray-200 p-3 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
              {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-[11px] text-gray-400 truncate">{user?.role === 'super_admin' ? 'Super Admin' : 'Sub User'}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 h-9 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm" onClick={logout}>
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </aside>
    </>
  )
}

export function Header() {
  const { activeSection, user, setSidebarOpen, notificationCount } = useAppStore()
  const labels: Record<Section, string> = {
    dashboard: 'Dashboard', child_care: 'Child Care', elder_care: 'Elder Care',
    doctors: 'Doctors', patients: 'Patients', bookings: 'Bookings',
    prescriptions: 'Prescriptions', caregivers: 'Caregivers', subusers: 'Sub Users',
    commission: 'Commission & Revenue', analytics: 'Analytics',
    verification: 'Verifications', services: 'Service Catalog', profile: 'My Profile',
  }

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 md:px-6 gap-4 shrink-0">
      <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={() => setSidebarOpen(true)}>
        <Separator orientation="vertical" className="!h-5 !w-1 bg-gray-900" />
      </Button>
      <h2 className="text-lg font-semibold text-gray-900">{labels[activeSection]}</h2>
      <div className="ml-auto flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}