'use client'

import { useAppStore, type Section, type UserPermissions } from '@/lib/store'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell } from 'lucide-react'
import {
  LayoutDashboard, Baby, Users, Stethoscope, FileText, CalendarDays,
  UserCog, IndianRupee, BarChart3, ShieldCheck, Package, LogOut, ChevronLeft,
  ClipboardList, UserCircle, Settings
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
  { id: 'doctors', label: 'Doctors', icon: Stethoscope, permission: 'doctors' },
  { id: 'bookings', label: 'Bookings', icon: CalendarDays, permission: 'bookings' },
  { id: 'prescriptions', label: 'Prescriptions', icon: FileText, permission: 'prescriptions' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics' },
  { id: 'patients', label: 'Patients', icon: ClipboardList, permission: 'patients' },
  { id: 'verification', label: 'Verification', icon: ShieldCheck, permission: 'verification' },
  { id: 'commission', label: 'Commission Settings', icon: IndianRupee, permission: 'commission' },
  { id: 'subusers', label: 'Sub Users', icon: UserCog, permission: 'subusers' },
  { id: 'caregivers', label: 'Care Partners', icon: UserCircle, permission: 'caregivers' },
  { id: 'services', label: 'Services', icon: Package, permission: 'services' },
  { id: 'child_care', label: 'Child & Elder Care', icon: Baby, permission: 'child_care' },
  { id: 'profile', label: 'My Profile', icon: Settings, permission: 'profile' },
]

const handleLogout = () => {
  fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
  localStorage.removeItem('nurturee_admin_session')
  useAppStore.getState().logout()
}

export function Sidebar() {
  const { activeSection, setActiveSection, user, logout, sidebarOpen, setSidebarOpen } = useAppStore()
  const permissions = user?.permissions
  const visibleItems = navItems.filter(item => permissions?.[item.permission])

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[240px] bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-100 shrink-0">
          <img src="/logo.png" alt="Nurturee" className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="font-bold text-gray-900 text-base leading-tight">Nurturee</h1>
            <p className="text-[11px] text-gray-400 leading-tight">Admin Panel</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 py-3">
          <div className="px-3 space-y-0.5">
            {visibleItems.map((item, idx) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              const showSeparator = item.id === 'profile' && idx > 0
              return (
                <div key={item.id}>
                  {showSeparator && <Separator className="my-2 bg-gray-100" />}
                  <Button
                    variant="ghost"
                    className={cn(
                      'w-full justify-start gap-3 h-10 px-3 font-normal text-sm rounded-lg',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-medium hover:bg-blue-50 hover:text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                    onClick={() => { setActiveSection(item.id); setSidebarOpen(false) }}
                  >
                    <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-blue-600' : 'text-gray-400')} />
                    {item.label}
                  </Button>
                </div>
              )
            })}
          </div>
        </ScrollArea>

        {/* User */}
        <div className="border-t border-gray-100 p-4 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full text-left hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  {(user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user?.role === 'super_admin' ? 'Super Admin' : 'Sub User'}</p>
                  <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setActiveSection('profile'); setSidebarOpen(false) }} className="cursor-pointer gap-2">
                <Settings className="w-4 h-4" />
                My Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
                <LogOut className="w-4 h-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  )
}

export function Header() {
  const { activeSection, user, setSidebarOpen, notificationCount, setActiveSection } = useAppStore()
  const labels: Record<Section, string> = {
    dashboard: 'Dashboard', child_care: 'Child & Elder Care', elder_care: 'Elder Care',
    doctors: 'Doctors', patients: 'Patients', bookings: 'Bookings',
    prescriptions: 'Prescriptions', caregivers: 'Care Partners', subusers: 'Sub Users',
    commission: 'Commission Settings', analytics: 'Analytics',
    verification: 'Verification', services: 'Services', profile: 'My Profile',
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center px-5 gap-4 shrink-0">
      <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
        <Separator orientation="vertical" className="!h-4 !w-1 bg-gray-900" />
      </Button>
      <h2 className="text-sm font-semibold text-gray-900">{labels[activeSection]}</h2>
      <div className="ml-auto flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative cursor-pointer hover:text-gray-700 transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
              {notificationCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-64">
            <DropdownMenuLabel className="text-xs">Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notificationCount > 0 ? (
              <DropdownMenuItem className="text-sm text-blue-700 cursor-pointer gap-2">
                <Bell className="w-4 h-4" />
                {notificationCount} unread notification{notificationCount > 1 ? 's' : ''}
              </DropdownMenuItem>
            ) : (
              <div className="px-2 py-3 text-sm text-gray-400 text-center">No new notifications</div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold hover:ring-2 hover:ring-blue-300 transition-all cursor-pointer">
              {(user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()) || 'A'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="bottom" align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActiveSection('profile')} className="cursor-pointer gap-2">
              <Settings className="w-4 h-4" />
              My Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="w-4 h-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}