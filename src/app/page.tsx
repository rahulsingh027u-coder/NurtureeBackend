'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { LoginPage } from '@/components/admin/sections/LoginPage'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'

export default function Home() {
  const { isAuthenticated, setActiveSection, logout } = useAppStore()

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

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <AdminLayout />
}