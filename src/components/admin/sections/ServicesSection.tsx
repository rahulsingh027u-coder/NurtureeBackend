'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { RefreshCw, Stethoscope, Heart, Baby, UserCheck } from 'lucide-react'

interface Service {
  id: string
  name: string
  subCategory: string
  duration: string
  priceOnline?: number
  priceHome?: number
  price: number
  priceType: 'dual' | 'monthly' | 'per_visit' | 'per_verification'
  mode: 'online' | 'in_home' | 'both'
  active: boolean
}

type CategoryKey = 'child_care' | 'elder_care' | 'doctor_consultation' | 'caregiver_verification'

const modeColor: Record<string, string> = {
  online: 'bg-blue-100 text-blue-700',
  in_home: 'bg-orange-100 text-orange-700',
  both: 'bg-purple-100 text-purple-700',
}

const tabMeta: Record<CategoryKey, { label: string; icon: React.ElementType }> = {
  child_care: { label: 'Child Care', icon: Baby },
  elder_care: { label: 'Elder Care', icon: Heart },
  doctor_consultation: { label: 'Doctor Consultation', icon: Stethoscope },
  caregiver_verification: { label: 'Caregiver Verification', icon: UserCheck },
}

function formatPrice(service: Service): string {
  if (service.priceType === 'dual') {
    const online = service.priceOnline ?? service.price
    const home = service.priceHome ?? service.price
    return `₹${online.toLocaleString('en-IN')} online · ₹${home.toLocaleString('en-IN')} at-home`
  }
  const suffix = service.priceType === 'monthly' ? '/month' : service.priceType === 'per_visit' ? '/visit' : '/verification'
  return `₹${service.price.toLocaleString('en-IN')}${suffix}`
}

function ServiceTable({ services, loading }: { services: Service[]; loading: boolean }) {
  return (
    <div className="max-h-[500px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Name</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Sub-Category</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Duration</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Price</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Mode</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-gray-500">Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-20" /></TableCell>
                ))}
              </TableRow>
            ))
          ) : services.length > 0 ? (
            services.map((s) => (
              <TableRow key={s.id} className="hover:bg-gray-50/50">
                <TableCell className="text-sm font-medium text-gray-900">{s.name}</TableCell>
                <TableCell className="text-sm text-gray-600">{s.subCategory}</TableCell>
                <TableCell className="text-sm text-gray-600">{s.duration}</TableCell>
                <TableCell className="text-sm text-gray-700 font-mono whitespace-nowrap">{formatPrice(s)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={cn('text-[11px] capitalize', modeColor[s.mode] || 'bg-gray-100 text-gray-800')}>
                    {s.mode.replace('_', '-')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full', s.active ? 'bg-blue-500' : 'bg-red-500')} />
                    <span className="text-sm text-gray-600">{s.active ? 'Active' : 'Inactive'}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-400 text-sm">
                No services found in this category
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export function ServicesSection() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<Record<CategoryKey, Service[]>>({
    child_care: [],
    elder_care: [],
    doctor_consultation: [],
    caregiver_verification: [],
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/services')
      if (res.ok) {
        const data = await res.json()
        const d = data ?? {}
        setServices({
          child_care: Array.isArray(d.child_care) ? d.child_care : [],
          elder_care: Array.isArray(d.elder_care) ? d.elder_care : [],
          doctor_consultation: Array.isArray(d.doctor_consultation) ? d.doctor_consultation : [],
          caregiver_verification: Array.isArray(d.caregiver_verification) ? d.caregiver_verification : [],
        })
      } else {
        toast({ title: 'Error', description: 'Failed to fetch services', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const totalServices = Object.values(services).flat().length
  const activeServices = Object.values(services).flat().filter((s) => s.active).length

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-8" /> : <p className="text-2xl font-bold text-gray-900">{totalServices}</p>}
              <p className="text-xs text-gray-500">Total Services</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-8" /> : <p className="text-2xl font-bold text-gray-900">{activeServices}</p>}
              <p className="text-xs text-gray-500">Active Services</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl shadow-sm border-0">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              {loading ? <Skeleton className="h-7 w-8" /> : <p className="text-2xl font-bold text-gray-900">{totalServices - activeServices}</p>}
              <p className="text-xs text-gray-500">Inactive Services</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="child_care" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            {(Object.keys(tabMeta) as CategoryKey[]).map((key) => {
              const { label, icon: Icon } = tabMeta[key]
              return (
                <TabsTrigger key={key} value={key} className="gap-1.5 text-xs">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </TabsTrigger>
              )
            })}
          </TabsList>
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50 gap-1.5"
            onClick={fetchServices}
            disabled={loading}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {(Object.keys(tabMeta) as CategoryKey[]).map((key) => (
          <TabsContent key={key} value={key}>
            <Card className="bg-white rounded-xl shadow-sm border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-900">{tabMeta[key].label} Services</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ServiceTable services={services[key]} loading={loading} />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
