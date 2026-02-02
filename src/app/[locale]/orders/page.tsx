"use client"

import * as React from "react"
import { Plus, Upload, Filter, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { OrderTable } from "@/components/orders/OrderTable"
import { OrderSheet } from "@/components/orders/OrderSheet"
import { OrderImportModal } from "@/components/orders/OrderImportModal"
import { BulkActionBar } from "@/components/orders/BulkActionBar"
import { BulkDeleteDialog } from "@/components/orders/BulkDeleteDialog"
import { DateRangePickers } from "@/components/ui/date-range-pickers"
import { StatusSelect, type StatusOption } from "@/components/ui/status-select"
import { BranchSearch } from "@/components/ui/branch-search"
import { DateRange } from "react-day-picker"
import { useI18n } from '@/locales/client'

export default function OrdersPage() {
  const t = useI18n()

  // Create translated status options
  const statusOptions: StatusOption[] = [
    { value: "ALL", label: t('Orders.filters.statusAll'), color: "bg-slate-400" },
    { value: "NEW", label: t('Orders.filters.statusNew'), color: "bg-blue-500" },
    { value: "CONFIRMED", label: t('Orders.filters.statusConfirmed'), color: "bg-purple-500" },
    { value: "PICKING", label: t('Orders.filters.statusPicking'), color: "bg-amber-500" },
    { value: "PACKING", label: t('Orders.filters.statusPacking'), color: "bg-orange-500" },
    { value: "READY", label: t('Orders.filters.statusReady'), color: "bg-cyan-500" },
    { value: "SHIPPED", label: t('Orders.filters.statusShipped'), color: "bg-indigo-500" },
    { value: "PARTIAL", label: t('Orders.filters.statusPartial'), color: "bg-yellow-500" },
    { value: "COMPLETED", label: t('Orders.filters.statusCompleted'), color: "bg-emerald-500" },
    { value: "INVOICED", label: t('Orders.filters.statusInvoiced'), color: "bg-teal-500" },
    { value: "PAID", label: t('Orders.filters.statusPaid'), color: "bg-green-500" },
    { value: "CANCELLED", label: t('Orders.filters.statusCancelled'), color: "bg-red-500" },
  ]

  // Filter State
  const [date, setDate] = React.useState<DateRange | undefined>()
  const [status, setStatus] = React.useState("ALL")
  const [branch, setBranch] = React.useState("")
  const [search, setSearch] = React.useState("")

  // Data State
  const [orders, setOrders] = React.useState<any[]>([])
  const [totalCount, setTotalCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  // Editor State
  const [isEditorOpen, setIsEditorOpen] = React.useState(false)
  const [editingOrder, setEditingOrder] = React.useState<any>(null)

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false)

  // Bulk Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isBulkInvoiceLoading, setIsBulkInvoiceLoading] = React.useState(false)

  // Fetch orders when filters change
  React.useEffect(() => {
    fetchOrders()
  }, [date, status, branch, search])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query params
      const params = new URLSearchParams()
      if (status && status !== 'ALL') params.append('status', status)
      if (branch) params.append('branch', branch)
      if (search) params.append('search', search)
      if (date?.from) params.append('dateFrom', date.from.toISOString())
      if (date?.to) params.append('dateTo', date.to.toISOString())

      const response = await fetch(`/api/orders?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch orders')

      const data = await response.json()
      setOrders(data.orders)
      setTotalCount(data.total)
    } catch (err: any) {
      setError(err.message)
      console.error('Orders fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    try {
      setIsDeleting(true)

      const response = await fetch('/api/orders/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedIds })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete orders')
      }

      const result = await response.json()

      // Success: refresh orders list and clear selection
      await fetchOrders()
      setSelectedIds([])
      setIsDeleteDialogOpen(false)

      console.log(`Successfully deleted ${result.deletedCount} orders`)

    } catch (err: any) {
      console.error('Bulk delete error:', err)
      // Keep dialog open so user can retry
      alert(`Failed to delete orders: ${err.message}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkInvoice = async (separate: boolean = false) => {
    try {
      setIsBulkInvoiceLoading(true)

      const response = await fetch('/api/orders/bulk-schet-faktura', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderIds: selectedIds,
          separate
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate invoices')
      }

      // Extract filename
      let filename = `bulk-schet-faktura-${new Date().toISOString().split('T')[0]}.pdf`
      const contentDisposition = response.headers.get('Content-Disposition')

      if (contentDisposition) {
        const parts = contentDisposition.split('filename=')
        if (parts.length > 1) {
          filename = parts[1].replace(/"/g, '')
        }
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      console.log(`Successfully generated ${selectedIds.length} invoices`)

    } catch (err: any) {
      console.error('Bulk invoice error:', err)
      alert(`Failed to generate invoices: ${err.message}`)
    } finally {
      setIsBulkInvoiceLoading(false)
    }
  }

  const handleNewOrder = () => {
    setEditingOrder(null)
    setIsEditorOpen(true)
  }

  const handleEditOrder = async (order: any) => {
    try {
      // Fetch full order details with items
      const res = await fetch(`/api/orders/${order.id}`)
      if (!res.ok) throw new Error('Failed to fetch order details')

      const fullOrder = await res.json()
      setEditingOrder(fullOrder)
      setIsEditorOpen(true)
    } catch (error: any) {
      console.error('Error loading order:', error)
      alert(`Failed to load order details: ${error.message}`)
    }
  }

  const handleSaveOrder = async (data: any) => {
    try {
      if (editingOrder?.id) {
        // Update existing order
        const res = await fetch(`/api/orders/${editingOrder.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to update order')
        }

        console.log('Order updated successfully')
      } else {
        // Create new order
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to create order')
        }

        console.log('Order created successfully')
      }

      setIsEditorOpen(false)
      setEditingOrder(null)
      await fetchOrders() // Refresh list
    } catch (error: any) {
      console.error('Save order error:', error)
      alert(`Failed to save order: ${error.message}`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Command Bar (Mobile Optimized Grid) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t('Orders.title')}</h1>
            <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-none px-2.5 tabular-nums">
              {loading ? '...' : `${totalCount.toLocaleString()} ${t('Orders.total')}`}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-10 gap-2 text-slate-600 border-slate-200 hover:bg-slate-50"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">{t('Orders.importExcel')}</span>
            </Button>
            <Button
              onClick={handleNewOrder}
              className="h-10 gap-2 bg-sky-600 hover:bg-sky-700 text-white shadow-sm border-none shadow-sky-100"
            >
              <Plus className="h-4 w-4" />
              {t('Orders.newOrder')}
            </Button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('Orders.searchPlaceholder')}
              className="pl-9 h-10 bg-slate-50 border-slate-200 hover:bg-white transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DateRangePickers
            date={date}
            onDateChange={setDate}
          />

          <StatusSelect
            value={status}
            onValueChange={setStatus}
            statuses={statusOptions}
          />

          <BranchSearch
            value={branch}
            onValueChange={setBranch}
            placeholder={t('Orders.filters.branchPlaceholder')}
            searchPlaceholder={t('Orders.filters.branchSearchInput')}
            emptyText={t('Orders.filters.branchNotFound')}
          />

          <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-slate-600 ml-auto">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onBulkDelete={() => setIsDeleteDialogOpen(true)}
        onBulkInvoice={handleBulkInvoice}
        onAssignComplete={fetchOrders}
      />

      {/* Main Table */}
      <OrderTable
        orders={orders}
        loading={loading}
        error={error}
        onEdit={handleEditOrder}
        selection={selectedIds}
        onSelectionChange={setSelectedIds}
      />

      <OrderSheet
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        initialData={editingOrder}
        onSave={handleSaveOrder}
      />

      <OrderImportModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImportComplete={() => {
          // Refresh orders after successful import
          fetchOrders()
        }}
      />

      <BulkDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        selectedCount={selectedIds.length}
        onConfirm={handleBulkDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
