"use client"

import * as React from "react"
import { useState, useEffect, useMemo, useCallback } from "react"
import { Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchWithAuth, formatPrice } from "@/lib/utils"

interface CustomerGroup {
  id: string
  name: string
  description?: string
}

interface Product {
  id: string
  name: string
  sapCode?: string
  unitPrice: number
}

interface PriceEntry {
  id?: string
  customerGroupId: string
  productId: string
  basePrice: number
}

interface EditedPrice {
  customerGroupId: string
  productId: string
  value: string
}

export function PriceMatrix() {
  const [groups, setGroups] = useState<CustomerGroup[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [priceEntries, setPriceEntries] = useState<PriceEntry[]>([])
  const [editedPrices, setEditedPrices] = useState<EditedPrice[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [groupsRes, productsRes, matrixRes] = await Promise.all([
        fetchWithAuth('/api/customer-groups').then(r => r.json()),
        fetchWithAuth('/api/products').then(r => r.json()),
        fetchWithAuth('/api/price-lists/matrix').then(r => r.json()),
      ])
      setGroups(groupsRes.groups || [])
      setProducts(productsRes.products || [])
      setPriceEntries(matrixRes.entries || [])
    } catch (error: any) {
      setMessage(`Error loading data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getPrice = useCallback((productId: string, groupId: string): string => {
    const edited = editedPrices.find(
      e => e.productId === productId && e.customerGroupId === groupId
    )
    if (edited) return edited.value

    const entry = priceEntries.find(
      e => e.productId === productId && e.customerGroupId === groupId
    )
    return entry ? String(entry.basePrice) : ''
  }, [editedPrices, priceEntries])

  const handlePriceChange = useCallback((productId: string, groupId: string, value: string) => {
    setEditedPrices(prev => {
      const existing = prev.findIndex(
        e => e.productId === productId && e.customerGroupId === groupId
      )
      const newEntry: EditedPrice = { productId, customerGroupId: groupId, value }
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = newEntry
        return updated
      }
      return [...prev, newEntry]
    })
  }, [])

  const hasChanges = editedPrices.length > 0

  const handleSave = async () => {
    if (!hasChanges) return
    setSaving(true)
    setMessage('')

    try {
      const updates = editedPrices
        .filter(e => e.value !== '')
        .map(e => ({
          customerGroupId: e.customerGroupId,
          productId: e.productId,
          basePrice: parseFloat(e.value) || 0,
        }))

      const deletes = editedPrices
        .filter(e => e.value === '')
        .map(e => ({
          customerGroupId: e.customerGroupId,
          productId: e.productId,
        }))

      if (updates.length > 0) {
        const response = await fetchWithAuth('/api/price-lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: updates }),
        })
        if (!response.ok) throw new Error('Failed to save prices')
      }

      if (deletes.length > 0) {
        for (const del of deletes) {
          const entry = priceEntries.find(
            e => e.productId === del.productId && e.customerGroupId === del.customerGroupId
          )
          if (entry?.id) {
            await fetchWithAuth(`/api/price-lists/${entry.id}`, { method: 'DELETE' })
          }
        }
      }

      setEditedPrices([])
      await loadData()
      setMessage('Prices saved successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (error: any) {
      setMessage(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading price matrix...</p>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="bg-amber-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📊</span>
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Customer Groups</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Create customer groups first to set up group-level pricing. Use the API to create groups.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Price Matrix</h2>
          <p className="text-xs text-slate-500">
            Set group-level prices. Products as rows, customer groups as columns.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <span className={`text-sm font-medium ${message.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
              {message}
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save All</>
            )}
          </Button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-900 uppercase tracking-wider sticky left-0 bg-slate-50/50 z-10 min-w-[200px]">
                  Product
                </th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[120px]">
                  Base Price
                </th>
                {groups.map(group => (
                  <th key={group.id} className="px-4 py-3 text-right text-xs font-bold text-slate-900 uppercase tracking-wider min-w-[140px]">
                    <div>{group.name}</div>
                    {group.description && (
                      <div className="font-normal text-slate-400 normal-case tracking-normal mt-0.5">
                        {group.description}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product, idx) => (
                <tr
                  key={product.id}
                  className={`border-b border-slate-100 hover:bg-slate-50/50 ${idx % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                >
                  <td className="px-4 py-2 sticky left-0 bg-inherit z-10">
                    <div className="text-sm font-semibold text-slate-900">{product.name}</div>
                    {product.sapCode && (
                      <div className="text-[10px] font-mono text-slate-400">{product.sapCode}</div>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className="text-sm font-mono text-slate-500 tabular-nums">
                      {formatPrice(product.unitPrice)}
                    </span>
                  </td>
                  {groups.map(group => {
                    const value = getPrice(product.id, group.id)
                    const isEdited = editedPrices.some(
                      e => e.productId === product.id && e.customerGroupId === group.id
                    )
                    return (
                      <td key={group.id} className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={value}
                          onChange={(e) => handlePriceChange(product.id, group.id, e.target.value)}
                          placeholder={formatPrice(product.unitPrice)}
                          className={`w-full px-2 py-1.5 text-right text-sm font-mono tabular-nums bg-slate-50 border rounded-md
                            hover:bg-white transition-all focus:ring-1 focus:ring-sky-600 focus:border-sky-600
                            ${isEdited ? 'border-sky-300 bg-sky-50/50' : 'border-slate-200'}
                          `}
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
