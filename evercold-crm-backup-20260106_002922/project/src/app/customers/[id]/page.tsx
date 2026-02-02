'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface CustomerDetail {
  id: string
  name: string
  customerCode: string | null
  email: string | null
  phone: string | null
  headquartersAddress: string | null
  contractNumber: string | null
  hasVat: boolean
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
  productPrices: Array<{
    id: string
    unitPrice: number
    product: {
      id: string
      name: string
      unit: string
    }
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
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [showAddBranchModal, setShowAddBranchModal] = useState(false)
  const [newBranch, setNewBranch] = useState({
    branchName: '',
    branchCode: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
  })
  const [editingBranch, setEditingBranch] = useState<string | null>(null)
  const [editBranchData, setEditBranchData] = useState<any>({})

  useEffect(() => {
    if (params.id) {
      fetchCustomer(params.id as string)
    }
  }, [params.id])

  const fetchCustomer = async (id: string) => {
    try {
      const response = await fetch(`/api/customers/${id}`)
      if (!response.ok) throw new Error('Failed to fetch customer')

      const data = await response.json()
      setCustomer(data)
      setEditData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const updateCustomer = async () => {
    if (!customer) return

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (!response.ok) throw new Error('Failed to update customer')

      const updated = await response.json()
      setCustomer({ ...customer, ...updated })
      setEditing(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const deleteCustomer = async () => {
    if (!customer) return

    if (!confirm(`Are you sure you want to delete ${customer.name}?`)) return

    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete customer')

      router.push('/customers')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const addBranch = async () => {
    if (!customer) return

    try {
      const response = await fetch(`/api/customers/${customer.id}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBranch),
      })

      if (!response.ok) throw new Error('Failed to add branch')

      const created = await response.json()
      setCustomer({
        ...customer,
        branches: [...customer.branches, created],
      })
      setNewBranch({ branchName: '', branchCode: '', address: '', contactPerson: '', contactPhone: '' })
      setShowAddBranchModal(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const startEditBranch = (branch: any) => {
    setEditingBranch(branch.id)
    setEditBranchData(branch)
  }

  const updateBranch = async () => {
    if (!customer || !editingBranch) return

    try {
      const response = await fetch(`/api/customers/${customer.id}/branches/${editingBranch}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editBranchData),
      })

      if (!response.ok) throw new Error('Failed to update branch')

      const updated = await response.json()
      setCustomer({
        ...customer,
        branches: customer.branches.map(b => b.id === editingBranch ? updated : b),
      })
      setEditingBranch(null)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const deleteBranch = async (branchId: string, branchName: string) => {
    if (!customer) return

    if (!confirm(`Are you sure you want to delete branch ${branchName}?`)) return

    try {
      const response = await fetch(`/api/customers/${customer.id}/branches/${branchId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete branch')

      setCustomer({
        ...customer,
        branches: customer.branches.filter(b => b.id !== branchId),
      })
    } catch (err: any) {
      alert(err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer...</p>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-600 mb-4">Error: {error || 'Customer not found'}</div>
          <Link href="/customers" className="text-indigo-600 hover:text-indigo-800">
            ← Back to Customers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/customers" className="text-indigo-600 hover:text-indigo-800 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Customers
          </Link>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{customer.name}</h2>
              {customer.customerCode && (
                <p className="text-gray-600 mt-1">Code: {customer.customerCode}</p>
              )}
            </div>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    onClick={updateCustomer}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditData(customer)
                    }}
                    className="px-3 py-1.5 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={deleteCustomer}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editData.name || ''}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Code</label>
                <input
                  type="text"
                  value={editData.customerCode || ''}
                  onChange={(e) => setEditData({ ...editData, customerCode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editData.email || ''}
                  onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editData.phone || ''}
                  onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-base font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  value={editData.headquartersAddress || ''}
                  onChange={(e) => setEditData({ ...editData, headquartersAddress: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Contract Number</label>
                <input
                  type="text"
                  value={editData.contractNumber || ''}
                  onChange={(e) => setEditData({ ...editData, contractNumber: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.hasVat || false}
                    onChange={(e) => setEditData({ ...editData, hasVat: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-base font-semibold text-gray-700">
                    С НДС (VAT-registered)
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-semibold text-gray-700 uppercase mb-1">Email</p>
                <p className="text-base font-medium text-gray-900">{customer.email || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 uppercase mb-1">Phone</p>
                <p className="text-base font-medium text-gray-900">{customer.phone || '—'}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-gray-700 uppercase mb-1">Address</p>
                <p className="text-base font-medium text-gray-900">{customer.headquartersAddress || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 uppercase mb-1">Contract Number</p>
                <p className="text-base font-medium text-gray-900">{customer.contractNumber || '—'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-700 uppercase mb-1">VAT Status</p>
                <p className="text-base font-medium text-gray-900">
                  {customer.hasVat ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-800">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      С НДС
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Без НДС
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Branches */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Branches ({customer.branches.length})</h3>
            <button
              onClick={() => setShowAddBranchModal(true)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Branch
            </button>
          </div>

          {customer.branches.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-20 h-20 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No branches yet</h3>
              <p className="text-gray-600 mb-6">Add your first branch to get started</p>
              <button
                onClick={() => setShowAddBranchModal(true)}
                className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Add Branch
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-200 uppercase">
                      Branch
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-200 uppercase">
                      Code
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-200 uppercase">
                      Address
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-200 uppercase">
                      Contact
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-200 uppercase">
                      City
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-200 uppercase">
                      Hours
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-bold text-gray-200 uppercase">
                      Coordinates
                    </th>
                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-200 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customer.branches.map((branch) => (
                    <tr key={branch.id} className={editingBranch === branch.id ? "bg-blue-50" : "hover:bg-gray-50"}>
                      {editingBranch === branch.id ? (
                        <>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={editBranchData.branchName || ''}
                              onChange={(e) => setEditBranchData({ ...editBranchData, branchName: e.target.value })}
                              className="w-full px-2 py-1 border border-indigo-300 rounded text-sm text-gray-900 placeholder:text-gray-500"
                              placeholder="Branch Name"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="text"
                              value={editBranchData.branchCode || ''}
                              onChange={(e) => setEditBranchData({ ...editBranchData, branchCode: e.target.value })}
                              className="w-full px-2 py-1 border border-indigo-300 rounded text-sm text-gray-900 placeholder:text-gray-500"
                              placeholder="Code"
                            />
                          </td>
                          <td className="px-2 py-2">
                            <textarea
                              value={editBranchData.address || ''}
                              onChange={(e) => setEditBranchData({ ...editBranchData, address: e.target.value })}
                              rows={2}
                              className="w-full px-2 py-1 border border-indigo-300 rounded text-sm text-gray-900 placeholder:text-gray-500"
                              placeholder="Address"
                            />
                          </td>
                          <td className="px-2 py-2" colSpan={5}>
                            <div className="text-xs text-gray-600">
                              Contact, City, Hours & Coordinates are read-only
                            </div>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={updateBranch}
                                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save
                              </button>
                              <button
                                onClick={() => setEditingBranch(null)}
                                className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-xs flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-2 py-2">
                            <div className="text-sm font-semibold text-gray-900">
                              {branch.oldBranchName || branch.branchName}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs">
                              {branch.oldBranchCode && (
                                <div className="font-bold text-indigo-700">{branch.oldBranchCode}</div>
                              )}
                              <div className="text-gray-500">{branch.branchCode}</div>
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-900 max-w-xs">
                              {branch.address || '—'}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-900">
                              {branch.contactPerson && <div>{branch.contactPerson}</div>}
                              {branch.contactPhone && <div className="text-gray-600">{branch.contactPhone}</div>}
                              {!branch.contactPerson && !branch.contactPhone && '—'}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-900">
                              {branch.city && <div className="font-semibold">{branch.city}</div>}
                              {branch.region && <div className="text-gray-600">{branch.region}</div>}
                              {!branch.city && !branch.region && '—'}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            <div className="text-xs text-gray-900">
                              {branch.operatingHours || '—'}
                            </div>
                          </td>
                          <td className="px-2 py-2">
                            {branch.latitude && branch.longitude ? (
                              <div className="text-xs">
                                <div className="font-mono text-gray-700">
                                  {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                                </div>
                                <a
                                  href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 mt-0.5"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Map
                                </a>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => startEditBranch(branch)}
                                className="px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </button>
                              <button
                                onClick={() => deleteBranch(branch.id, branch.branchName)}
                                className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs flex items-center gap-1"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Del
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h3>
          {customer.orders.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Order #</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customer.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-base font-semibold text-gray-900">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                        {format(new Date(order.orderDate), 'dd.MM.yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base text-right font-semibold text-gray-900">
                        {order.totalAmount.toLocaleString()} сўм
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link href={`/orders/${order.id}`} className="px-2.5 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium text-xs inline-flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-right text-base font-bold text-gray-900">
                      Total ({customer.orders.length} orders):
                    </td>
                    <td className="px-6 py-4 text-right text-lg font-bold text-indigo-600">
                      {customer.orders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()} сўм
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Branch</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Branch Name *</label>
                <input
                  type="text"
                  value={newBranch.branchName}
                  onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Branch Code *</label>
                <input
                  type="text"
                  value={newBranch.branchCode}
                  onChange={(e) => setNewBranch({ ...newBranch, branchCode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={newBranch.contactPerson}
                  onChange={(e) => setNewBranch({ ...newBranch, contactPerson: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={newBranch.contactPhone}
                  onChange={(e) => setNewBranch({ ...newBranch, contactPhone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={addBranch}
                disabled={!newBranch.branchName || !newBranch.branchCode}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Branch
              </button>
              <button
                onClick={() => setShowAddBranchModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
