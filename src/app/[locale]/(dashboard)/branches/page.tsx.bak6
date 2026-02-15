'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Customer {
  id: string;
  name: string;
  customerCode: string | null;
}

interface Branch {
  id: string;
  customerId: string;
  branchName: string;
  branchCode: string;
  fullName: string;
  deliveryAddress: string | null;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  latitude: number | null;
  longitude: number | null;
  region: string | null;
  city: string | null;
  isActive: boolean;
  customer: {
    name: string;
  };
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  // Inline edit states
  const [editingBranch, setEditingBranch] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // New branch state
  const [addingBranch, setAddingBranch] = useState(false);
  const [newBranchData, setNewBranchData] = useState({
    customerId: '',
    branchName: '',
    branchCode: '',
    fullName: '',
    deliveryAddress: '',
    contactPerson: '',
    phone: '',
    email: '',
    latitude: '',
    longitude: '',
    region: '',
    city: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [branchesRes, customersRes] = await Promise.all([
        fetch('/api/branches', { credentials: 'include' })

        fetch('/api/customers', { credentials: 'include' })

      ]);

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(Array.isArray(branchesData) ? branchesData : branchesData.branches || []);
      }

      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(Array.isArray(customersData) ? customersData : customersData.customers || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditBranch = (branch: Branch) => {
    setEditingBranch(branch.id);
    setEditFormData({
      customerId: branch.customerId,
      branchName: branch.branchName,
      branchCode: branch.branchCode,
      fullName: branch.fullName,
      deliveryAddress: branch.deliveryAddress || '',
      contactPerson: branch.contactPerson || '',
      phone: branch.phone || '',
      email: branch.email || '',
      latitude: branch.latitude?.toString() || '',
      longitude: branch.longitude?.toString() || '',
      region: branch.region || '',
      city: branch.city || '',
      isActive: branch.isActive,
    });
  };

  const cancelEditBranch = () => {
    setEditingBranch(null);
    setEditFormData({});
  };

  const saveBranch = async (branchId: string) => {
    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : null,
          longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update branch');

      await fetchData();
      setEditingBranch(null);
      setEditFormData({});
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const createBranch = async () => {
    try {
      const response = await fetch('/api/branches', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBranchData,
          latitude: newBranchData.latitude ? parseFloat(newBranchData.latitude) : null,
          longitude: newBranchData.longitude ? parseFloat(newBranchData.longitude) : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create branch');
      }

      await fetchData();
      setAddingBranch(false);
      setNewBranchData({
        customerId: '',
        branchName: '',
        branchCode: '',
        fullName: '',
        deliveryAddress: '',
        contactPerson: '',
        phone: '',
        email: '',
        latitude: '',
        longitude: '',
        region: '',
        city: '',
      });
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  const deleteBranch = async (branchId: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;

    try {
      const response = await fetch(`/api/branches/${branchId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete branch');
      }

      await fetchData();
    } catch (error) {
      alert(`Error: ${(error as Error).message}`);
    }
  };

  // Filter branches
  const filteredBranches = branches.filter((branch) => {
    const matchesSearch =
      searchQuery === '' ||
      branch.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.branchCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.customer.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCustomer = filterCustomer === '' || branch.customerId === filterCustomer;

    return matchesSearch && matchesCustomer;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
              <p className="text-gray-600">Manage customer delivery locations</p>
            </div>
            <Link
              href="/routes"
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              ← Back to Routes
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search branches..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="w-64">
              <select
                value={filterCustomer}
                onChange={(e) => setFilterCustomer(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
              >
                <option value="">All Customers</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setAddingBranch(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"
            >
              + Add Branch
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Branches</p>
            <p className="text-2xl font-bold text-gray-900">{branches.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Active Branches</p>
            <p className="text-2xl font-bold text-green-600">
              {branches.filter((b) => b.isActive).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">With Coordinates</p>
            <p className="text-2xl font-bold text-blue-600">
              {branches.filter((b) => b.latitude && b.longitude).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Missing Coordinates</p>
            <p className="text-2xl font-bold text-orange-600">
              {branches.filter((b) => !b.latitude || !b.longitude).length}
            </p>
          </div>
        </div>

        {/* Add New Branch Form */}
        {addingBranch && (
          <div className="mb-6 bg-white border-2 border-indigo-500 rounded-lg p-6 shadow-lg text-gray-900 placeholder:text-gray-500">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Branch</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                <select
                  value={newBranchData.customerId}
                  onChange={(e) => setNewBranchData({ ...newBranchData, customerId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                >
                  <option value="">Select customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                <input
                  type="text"
                  value={newBranchData.branchName}
                  onChange={(e) => setNewBranchData({ ...newBranchData, branchName: e.target.value })}
                  placeholder="e.g., Chorsu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code *</label>
                <input
                  type="text"
                  value={newBranchData.branchCode}
                  onChange={(e) => setNewBranchData({ ...newBranchData, branchCode: e.target.value })}
                  placeholder="e.g., CHR-001"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newBranchData.fullName}
                  onChange={(e) => setNewBranchData({ ...newBranchData, fullName: e.target.value })}
                  placeholder="e.g., Korzinka - Chorsu"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <input
                  type="text"
                  value={newBranchData.deliveryAddress}
                  onChange={(e) => setNewBranchData({ ...newBranchData, deliveryAddress: e.target.value })}
                  placeholder="Street address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={newBranchData.contactPerson}
                  onChange={(e) => setNewBranchData({ ...newBranchData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newBranchData.phone}
                  onChange={(e) => setNewBranchData({ ...newBranchData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newBranchData.email}
                  onChange={(e) => setNewBranchData({ ...newBranchData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={newBranchData.city}
                  onChange={(e) => setNewBranchData({ ...newBranchData, city: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input
                  type="text"
                  value={newBranchData.region}
                  onChange={(e) => setNewBranchData({ ...newBranchData, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={newBranchData.latitude}
                  onChange={(e) => setNewBranchData({ ...newBranchData, latitude: e.target.value })}
                  placeholder="41.2995"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={newBranchData.longitude}
                  onChange={(e) => setNewBranchData({ ...newBranchData, longitude: e.target.value })}
                  placeholder="69.2401"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={createBranch}
                disabled={!newBranchData.customerId || !newBranchData.branchName || !newBranchData.branchCode || !newBranchData.fullName}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Branch
              </button>
              <button
                onClick={() => {
                  setAddingBranch(false);
                  setNewBranchData({
                    customerId: '',
                    branchName: '',
                    branchCode: '',
                    fullName: '',
                    deliveryAddress: '',
                    contactPerson: '',
                    phone: '',
                    email: '',
                    latitude: '',
                    longitude: '',
                    region: '',
                    city: '',
                  });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Branches List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 text-gray-900 placeholder:text-gray-500">
            <h2 className="text-lg font-semibold text-gray-900">
              Branches ({filteredBranches.length})
            </h2>
          </div>

          {filteredBranches.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No branches found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredBranches.map((branch) => {
                const isEditing = editingBranch === branch.id;
                const hasCoordinates = branch.latitude && branch.longitude;

                return (
                  <div key={branch.id} className="p-4 hover:bg-gray-50">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                            <input
                              type="text"
                              value={editFormData.branchName || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, branchName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
                            <input
                              type="text"
                              value={editFormData.branchCode || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, branchCode: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                              type="text"
                              value={editFormData.fullName || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div className="col-span-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                            <input
                              type="text"
                              value={editFormData.deliveryAddress || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, deliveryAddress: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                            <input
                              type="text"
                              value={editFormData.contactPerson || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                              type="tel"
                              value={editFormData.phone || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                              type="email"
                              value={editFormData.email || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <input
                              type="text"
                              value={editFormData.city || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                            <input
                              type="text"
                              value={editFormData.region || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.latitude || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                            <input
                              type="number"
                              step="any"
                              value={editFormData.longitude || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 text-gray-900 placeholder:text-gray-500"
                            />
                          </div>
                          <div className="flex items-center">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={editFormData.isActive || false}
                                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                                className="h-4 w-4 text-indigo-600 rounded mr-2"
                              />
                              <span className="text-sm font-medium text-gray-700">Active</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => saveBranch(branch.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditBranch}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{branch.branchName}</h3>
                            <span className="text-sm text-gray-500">({branch.branchCode})</span>
                            {!branch.isActive && (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Inactive</span>
                            )}
                            {!hasCoordinates && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">No GPS</span>
                            )}
                          </div>

                          <p className="text-sm text-gray-600 mb-2">{branch.fullName}</p>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Customer:</span> {branch.customer.name}
                            </div>
                            {branch.deliveryAddress && (
                              <div className="col-span-2">
                                <span className="font-medium">Address:</span> {branch.deliveryAddress}
                              </div>
                            )}
                            {branch.contactPerson && (
                              <div>
                                <span className="font-medium">Contact:</span> {branch.contactPerson}
                              </div>
                            )}
                            {branch.phone && (
                              <div>
                                <span className="font-medium">Phone:</span> {branch.phone}
                              </div>
                            )}
                            {branch.city && (
                              <div>
                                <span className="font-medium">City:</span> {branch.city}
                              </div>
                            )}
                            {hasCoordinates && (
                              <div className="col-span-2">
                                <span className="font-medium">Coordinates:</span> {branch.latitude?.toFixed(4)}, {branch.longitude?.toFixed(4)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4 flex gap-2">
                          <button
                            onClick={() => startEditBranch(branch)}
                            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteBranch(branch.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
