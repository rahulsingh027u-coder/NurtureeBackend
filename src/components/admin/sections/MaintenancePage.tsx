'use client'

import { useState, useEffect } from 'react'
import { Heart, RefreshCw } from 'lucide-react'

export function MaintenancePage() {
  const [message, setMessage] = useState('')
  const [time, setTime] = useState('')

  useEffect(() => {
    fetchMaintenance()
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const fetchMaintenance = async () => {
    try {
      const res = await fetch('/api/maintenance')
      if (res.ok) {
        const data = await res.json()
        setMessage(data.message)
      }
    } catch {
      setMessage('We are performing scheduled maintenance. We will be back shortly.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <Heart className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Brand */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Nurturee</h1>
          <p className="text-sm text-gray-400 mt-1">Healthcare Admin Portal</p>
        </div>

        {/* Status */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-amber-800">Under Maintenance</span>
          </div>
          <p className="text-sm text-amber-700 leading-relaxed">{message}</p>
        </div>

        {/* Time */}
        <div className="space-y-1">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Server Time</p>
          <p className="text-lg font-mono font-semibold text-gray-700">{time}</p>
        </div>

        {/* Refresh */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Check if We're Back
        </button>

        {/* Footer */}
        <p className="text-xs text-gray-300">
          If this persists, please contact your administrator
        </p>
      </div>
    </div>
  )
}