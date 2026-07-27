'use client'

import { useAppStore, type Section } from '@/lib/store'
import { Sidebar, Header } from '@/components/admin/layout/AdminLayout'
import { SectionErrorBoundary } from '@/components/admin/SectionErrorBoundary'
import { DashboardSection } from '@/components/admin/sections/DashboardSection'
import { ChildCareSection } from '@/components/admin/sections/ChildCareSection'
import { ElderCareSection } from '@/components/admin/sections/ElderCareSection'
import { DoctorsSection } from '@/components/admin/sections/DoctorsSection'
import { PatientsSection } from '@/components/admin/sections/PatientsSection'
import { BookingsSection } from '@/components/admin/sections/BookingsSection'
import { PrescriptionsSection } from '@/components/admin/sections/PrescriptionsSection'
import { CaregiversSection } from '@/components/admin/sections/CaregiversSection'
import { SubUsersSection } from '@/components/admin/sections/SubUsersSection'
import { CommissionSection } from '@/components/admin/sections/CommissionSection'
import { AnalyticsSection } from '@/components/admin/sections/AnalyticsSection'
import { VerificationSection } from '@/components/admin/sections/VerificationSection'
import { ServicesSection } from '@/components/admin/sections/ServicesSection'
import { ProfileSection } from '@/components/admin/sections/ProfileSection'
import { ScrollArea } from '@/components/ui/scroll-area'

const sectionComponents: Record<Section, React.ComponentType> = {
  dashboard: DashboardSection,
  child_care: ChildCareSection,
  elder_care: ElderCareSection,
  doctors: DoctorsSection,
  patients: PatientsSection,
  bookings: BookingsSection,
  prescriptions: PrescriptionsSection,
  caregivers: CaregiversSection,
  subusers: SubUsersSection,
  commission: CommissionSection,
  analytics: AnalyticsSection,
  verification: VerificationSection,
  services: ServicesSection,
  profile: ProfileSection,
}

const sectionLabels: Record<Section, string> = {
  dashboard: 'Dashboard',
  child_care: 'Child & Elder Care',
  elder_care: 'Elder Care',
  doctors: 'Doctors',
  patients: 'Patients',
  bookings: 'Bookings',
  prescriptions: 'Prescriptions',
  caregivers: 'Caregivers',
  subusers: 'Sub-Users',
  commission: 'Commission',
  analytics: 'Analytics',
  verification: 'Verification',
  services: 'Services',
  profile: 'Profile',
}

export function AdminLayout() {
  const { activeSection } = useAppStore()
  const SectionComponent = sectionComponents[activeSection] || DashboardSection

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <SectionErrorBoundary sectionName={sectionLabels[activeSection] || activeSection}>
              <SectionComponent />
            </SectionErrorBoundary>
          </ScrollArea>
        </main>
      </div>
    </div>
  )
}
