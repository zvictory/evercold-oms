"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CustomerDetailHeader } from '@/components/customers/CustomerDetailHeader'
import { CustomerInfoGrid } from '@/components/customers/CustomerInfoGrid'
import { CustomerBranchList } from '@/components/customers/CustomerBranchList'
import { CustomerEditSheet } from '@/components/customers/CustomerEditSheet'

// Define the interface locally to match the component needs
interface CustomerDetail {
  id: string
  name: string
  customerCode: string | null
  email: string | null
  phone: string | null
  headquartersAddress: string | null
  contractNumber: string | null
  hasVat: boolean
  taxStatus?: string | null
  customerGroupId?: string | null
  customerGroup?: { id: string; name: string } | null
  branches: Array<{
    id: string
    branchName: string
    branchCode: string
    oldBranchCode: string | null
    oldBranchName: string | null
    fullName: string
    address: string | null
    contactPerson: string | null
    contactPhone: string | null
    latitude: number | null
    longitude: number | null
    region: string | null
    city: string | null
    operatingHours: string | null
  }>
  orders: Array<{
    id: string
    orderNumber: string
    orderDate: string
    status: string
    totalAmount: number
  }>
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editSheetOpen, setEditSheetOpen] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchCustomer(params.id as string)
    }
  }, [params.id])

  const fetchCustomer = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`, {
        credentials: 'include'
      })
      if (!response.ok) throw new Error('Failed to fetch customer')

      const data = await response.json()
      setCustomer(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          <p className="text-sm font-medium text-slate-500">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 max-w-md text-center">
          <div className="text-red-600 mb-4 font-medium">Unable to load customer profile</div>
          <p className="text-slate-500 text-sm mb-6">{error || 'Customer not found'}</p>
          <button
            onClick={() => router.push(`/${params.locale}/customers`)}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
          >
            ← Back to Directory
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* Sticky Header */}
      <CustomerDetailHeader
        customerName={customer.name}
        customerCode={customer.customerCode}
        onEdit={() => setEditSheetOpen(true)}
        onAddBranch={() => { /* TODO: Wire up Add Branch Modal */ }}
      />

      {/* Edit Customer Sheet */}
      {customer && (
        <CustomerEditSheet
          isOpen={editSheetOpen}
          onClose={() => setEditSheetOpen(false)}
          customer={{
            id: customer.id,
            name: customer.name,
            customerCode: customer.customerCode,
            email: customer.email,
            phone: customer.phone,
            headquartersAddress: customer.headquartersAddress,
            contractNumber: customer.contractNumber,
            hasVat: customer.hasVat,
            taxStatus: customer.taxStatus,
            customerGroupId: customer.customerGroupId,
          }}
          onSuccess={() => {
            fetchCustomer(customer.id)
          }}
        />
      )}

      <div className="max-w-7xl mx-auto mt-6">
        {/* Info Grid */}
        <CustomerInfoGrid
          contractNumber={customer.contractNumber}
          taxId={null} // API doesn't return this yet, would prompt refactor
          hasVat={customer.hasVat}
          taxStatus={customer.taxStatus}
          customerGroupName={customer.customerGroup?.name}
          contactPerson={null} // API gap
          contactPhone={customer.phone}
          contactEmail={customer.email}
          totalBranches={customer.branches.length}
          // Mock data for gaps
          bankAccount="20208000900123456789"
          mfo="00456"
          lastOrderDate={customer.orders.length > 0 ? new Date(customer.orders[0].orderDate).toLocaleDateString() : undefined}
        />

        {/* Tabs Section */}
        <div className="px-6">
          <Tabs defaultValue="branches" className="w-full">
            <TabsList className="bg-white border border-slate-200 p-1 rounded-lg mb-6 h-auto">
              <TabsTrigger value="branches" className="px-4 py-2 text-sm data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md transition-all">
                Branches ({customer.branches.length})
              </TabsTrigger>
              <TabsTrigger value="contract" className="px-4 py-2 text-sm data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md transition-all">
                Contract & Prices
              </TabsTrigger>
              <TabsTrigger value="orders" className="px-4 py-2 text-sm data-[state=active]:bg-sky-50 data-[state=active]:text-sky-700 data-[state=active]:font-semibold data-[state=active]:shadow-sm rounded-md transition-all">
                Order History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="branches" className="mt-0">
              <CustomerBranchList
                branches={customer.branches.map(b => ({
                  ...b,
                  fullName: b.oldBranchName || b.fullName || b.branchName // Fallback logic
                }))}
                onViewBranch={(branchId) => {
                  router.push(`/${params.locale}/customers/${customer.id}/branches/${branchId}/edit`)
                }}
              />
            </TabsContent>

            <TabsContent value="contract">
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-slate-500 font-medium">Contract & Pricing Override management coming soon.</p>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <p className="text-slate-500 font-medium">Order History component coming soon.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
