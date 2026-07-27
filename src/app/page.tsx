'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { LoginPage } from '@/components/admin/sections/LoginPage'
import { MaintenancePage } from '@/components/admin/sections/MaintenancePage'
import { AdminLayout } from '@/components/admin/layout'

export default function Home() {
  const { isAuthenticated, setActiveSection, logout } = useAppStore()
  const [maintenanceEnabled, setMaintenanceEnabled] = useState<boolean | null>(null)

  // Check maintenance status on mount
  useEffect(() => {
    fetch('/api/maintenance')
      .then(res => res.json())
      .then(data => setMaintenanceEnabled(data.enabled === true))
      .catch(() => setMaintenanceEnabled(false))
  }, [])

  useEffect(() => {
    // Check if there's a stored session
    const stored = localStorage.getItem('nurturee_admin_session')
    if (stored) {
      try {
        const user = JSON.parse(stored)
        useAppStore.getState().login(user)
      } catch {
        localStorage.removeItem('nurturee_admin_session')
      }
    }
  }, [])

  useEffect(() => {
    const user = useAppStore.getState().user
    if (user) {
      localStorage.setItem('nurturee_admin_session', JSON.stringify(user))
    }
  }, [isAuthenticated])

  // Loading state while checking maintenance
  if (maintenanceEnabled === null) {
    return null
  }

  // If maintenance is ON and user is NOT authenticated → show maintenance page
  if (maintenanceEnabled && !isAuthenticated) {
    return <MaintenancePage />
  }

  // Normal flow: logged-in admins always see the app, even during maintenance
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <AdminLayout />
}