'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface Customer {
  id: string
  name: string
  customerCode: string | null
  contactEmail: string | null
  contactPhone: string | null
  hasVat: boolean
  branches: Array<{
    id: string
    branchName: string
    branchCode: string
    oldBranchCode: string | null
    oldBranchName: string | null
    fullName: string
    deliveryAddress: string | null
    latitude: number | null
    longitude: number | null
    region: string | null
    city: string | null
    operatingHours: string | null
  }>
  _count: {
    orders: number
    branches: number
  }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    customerCode: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    taxId: '',
    hasVat: false,
  })

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) throw new Error('Failed to fetch customers')

      const data = await response.json()
      setCustomers(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createCustomer = async () => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer),
      })

      if (!response.ok) throw new Error('Failed to create customer')

      const created = await response.json()
      setCustomers([...customers, { ...created, branches: [], _count: { orders: 0, branches: 0 } }])
      setNewCustomer({ name: '', customerCode: '', contactEmail: '', contactPhone: '', address: '', taxId: '', hasVat: false })
      setShowAddModal(false)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const toggleVat = async (customerId: string, hasVat: boolean) => {
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasVat }),
      })

      if (!response.ok) throw new Error('Failed to update VAT status')

      // Update local state
      setCustomers(customers.map(c =>
        c.id === customerId ? { ...c, hasVat } : c
      ))
    } catch (err: any) {
      alert(err.message)
      // Revert checkbox on error
      await fetchCustomers()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
            <p className="text-gray-600 mt-1">Total: {customers.length} customers</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            + Add Customer
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-gray-900 placeholder:text-gray-500">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {customers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <svg
              className="w-24 h-24 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No customers yet</h3>
            <p className="text-gray-600 mb-6">Add your first customer to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Customer
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Branches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    VAT
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <React.Fragment key={customer.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-semibold text-gray-900">{customer.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                        {customer.customerCode || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-base font-medium text-gray-900">{customer.contactEmail || '—'}</div>
                        <div className="text-sm font-medium text-gray-600">{customer.contactPhone || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                        {customer._count.branches}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">
                        {customer._count.orders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={customer.hasVat || false}
                          onChange={(e) => toggleVat(customer.id, e.target.checked)}
                          className="w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                          title={customer.hasVat ? 'С НДС' : 'Без НДС'}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium inline-block"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                    {customer.branches.length > 0 && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-700 mb-2">Branches ({customer.branches.length}):</div>
                          <div className="space-y-2">
                            {customer.branches.map((branch) => (
                              <div key={branch.id} className="flex items-start gap-4 p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">{branch.oldBranchName || branch.fullName}</div>
                                  <div className="text-xs text-gray-600 mt-1 flex gap-2">
                                    {branch.oldBranchCode && (
                                      <span className="font-mono bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">{branch.oldBranchCode}</span>
                                    )}
                                    <span className="font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{branch.branchCode}</span>
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="text-xs text-gray-700">
                                    <span className="font-semibold">Address:</span> {branch.deliveryAddress || 'N/A'}
                                  </div>
                                  {branch.city && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {branch.city}{branch.region && `, ${branch.region}`}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  {branch.latitude && branch.longitude ? (
                                    <div className="text-xs">
                                      <div className="font-semibold text-gray-700">Coordinates:</div>
                                      <div className="font-mono text-gray-600 mt-1">
                                        {branch.latitude.toFixed(6)}, {branch.longitude.toFixed(6)}
                                      </div>
                                      <a
                                        href={`https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 mt-1"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        View on Map
                                      </a>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-gray-500">No coordinates</div>
                                  )}
                                </div>
                                {branch.operatingHours && (
                                  <div className="flex-shrink-0">
                                    <div className="text-xs font-semibold text-gray-700">Hours:</div>
                                    <div className="text-xs text-gray-600 mt-1">{branch.operatingHours}</div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Customer</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500"
                  required
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">
                  Customer Code
                </label>
                <input
                  type="text"
                  value={newCustomer.customerCode}
                  onChange={(e) => setNewCustomer({ ...newCustomer, customerCode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newCustomer.contactEmail}
                  onChange={(e) => setNewCustomer({ ...newCustomer, contactEmail: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={newCustomer.contactPhone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, contactPhone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Address</label>
                <textarea
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-2">Tax ID</label>
                <input
                  type="text"
                  value={newCustomer.taxId}
                  onChange={(e) => setNewCustomer({ ...newCustomer, taxId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-base font-medium text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCustomer.hasVat}
                    onChange={(e) => setNewCustomer({ ...newCustomer, hasVat: e.target.checked })}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-base font-semibold text-gray-700">
                    С НДС (VAT-registered customer)
                  </span>
                </label>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={createCustomer}
                disabled={!newCustomer.name}
                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-lg text-base font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Customer
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-3 rounded-lg text-base font-semibold hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
