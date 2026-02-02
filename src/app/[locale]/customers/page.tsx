"use client"

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronRight, Home } from "lucide-react"
import { CustomerKPI } from '@/components/customers/CustomerKPI'
import { CustomerTable, Customer } from '@/components/customers/CustomerTable'
import { Button } from '@/components/ui/button'
import { useI18n, useCurrentLocale } from '@/locales/client'

export default function CustomersPage() {
  const t = useI18n()
  const locale = useCurrentLocale()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  // KPI State
  const [kpiStats, setKpiStats] = useState({
    totalOrgs: 0,
    totalBranches: 0,
    complianceRate: 100 // Mocked for now
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')

      const data = await response.json()

      // Map API response to our Table Interface
      const formattedCustomers: Customer[] = data.map((c: any) => ({
        id: c.id,
        name: c.name,
        customerCode: c.customerCode,
        taxId: c.taxId || "INN-PENDING", // Mock fallback
        contractNumber: c.contractNumber || `CTR-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
        contractStartDate: "Jan 1, 2024",
        contactPerson: c.contactPerson || "Manager",
        contactPhone: c.contactPhone,
        status: c.isActive ? "active" : "inactive",
        totalBranches: c._count?.branches || 0
      }))

      setCustomers(formattedCustomers)

      // Calculate KPIs
      const totalBranches = formattedCustomers.reduce((acc, curr) => acc + curr.totalBranches, 0)
      setKpiStats({
        totalOrgs: formattedCustomers.length,
        totalBranches,
        complianceRate: 98
      })

    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href={`/${locale}`} className="hover:text-slate-700 flex items-center gap-1">
              <Home className="h-3 w-3" /> {t('Customers.breadcrumbs.home')}
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-slate-900">{t('Customers.breadcrumbs.customers')}</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('Customers.title')}
          </h2>
          <p className="text-sm text-slate-500">
            {t('Customers.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm gap-2">
            <Plus className="h-4 w-4" />
            {t('Customers.newCustomer')}
          </Button>
        </div>
      </div>

      {/* KPI Strip */}
      <CustomerKPI
        totalOrgs={kpiStats.totalOrgs}
        totalBranches={kpiStats.totalBranches}
        complianceRate={kpiStats.complianceRate}
      />

      {/* Main Content */}
      {loading ? (
        <div className="w-full bg-white rounded-xl border border-slate-200 h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-sm text-slate-500">{t('Customers.loadingDirectory')}</p>
          </div>
        </div>
      ) : (
        <CustomerTable data={customers} />
      )}
    </div>
  )
}
