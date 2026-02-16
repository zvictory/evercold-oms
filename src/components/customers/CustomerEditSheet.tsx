"use client"

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchWithAuth } from "@/lib/utils"

interface CustomerEditSheetProps {
  isOpen: boolean
  onClose: () => void
  customer: {
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
  }
  onSuccess: () => void
}

export function CustomerEditSheet({ isOpen, onClose, customer, onSuccess }: CustomerEditSheetProps) {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    customerCode: customer.customerCode || '',
    email: customer.email || '',
    phone: customer.phone || '',
    headquartersAddress: customer.headquartersAddress || '',
    contractNumber: customer.contractNumber || '',
    hasVat: customer.hasVat || false,
    taxStatus: customer.taxStatus || (customer.hasVat ? 'VAT_PAYER' : 'EXEMPT'),
    customerGroupId: customer.customerGroupId || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [customerGroups, setCustomerGroups] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    fetchWithAuth('/api/customer-groups')
      .then(res => res.json())
      .then(data => setCustomerGroups(data.groups || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setFormData({
      name: customer.name || '',
      customerCode: customer.customerCode || '',
      email: customer.email || '',
      phone: customer.phone || '',
      headquartersAddress: customer.headquartersAddress || '',
      contractNumber: customer.contractNumber || '',
      hasVat: customer.hasVat || false,
      taxStatus: customer.taxStatus || (customer.hasVat ? 'VAT_PAYER' : 'EXEMPT'),
      customerGroupId: customer.customerGroupId || '',
    })
  }, [customer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Customer name is required')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update customer')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Customer</SheetTitle>
          <SheetDescription>
            Update customer information
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter customer name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerCode">Customer Code</Label>
            <Input
              id="customerCode"
              value={formData.customerCode}
              onChange={(e) => setFormData({ ...formData, customerCode: e.target.value })}
              placeholder="Enter customer code"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="customer@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+998 XX XXX XX XX"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Headquarters Address</Label>
            <Input
              id="address"
              value={formData.headquartersAddress}
              onChange={(e) => setFormData({ ...formData, headquartersAddress: e.target.value })}
              placeholder="Enter headquarters address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract">Contract Number</Label>
            <Input
              id="contract"
              value={formData.contractNumber}
              onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
              placeholder="Enter contract number"
            />
          </div>

          <div className="space-y-2">
            <Label>Tax Status</Label>
            <Select
              value={formData.taxStatus}
              onValueChange={(value) => setFormData({ ...formData, taxStatus: value, hasVat: value === 'VAT_PAYER' })}
            >
              <SelectTrigger className="bg-white border-slate-200 h-10">
                <SelectValue placeholder="Select tax status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VAT_PAYER">VAT Payer (12%)</SelectItem>
                <SelectItem value="EXEMPT">Exempt</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">Determines whether VAT is applied to orders</p>
          </div>

          <div className="space-y-2">
            <Label>Customer Group</Label>
            <Select
              value={formData.customerGroupId}
              onValueChange={(value) => setFormData({ ...formData, customerGroupId: value === '_none' ? '' : value })}
            >
              <SelectTrigger className="bg-white border-slate-200 h-10">
                <SelectValue placeholder="No group assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">No group</SelectItem>
                {customerGroups.map(group => (
                  <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">Assigns group-level pricing tier</p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="flex-1 bg-sky-600 hover:bg-sky-700"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
