'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BranchLocationPickerFullPage from '@/components/BranchLocationPickerFullPage';

interface Branch {
  id: string;
  branchName: string;
  branchCode: string;
  address: string | null;
  contactPerson: string | null;
  contactPhone: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function EditBranchPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const branchId = params.branchId as string;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    address: '',
    contactPerson: '',
    contactPhone: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const [initialFormData, setInitialFormData] = useState(formData);

  // Fetch branch data on mount
  useEffect(() => {
    async function fetchBranch() {
      try {
        const res = await fetch(`/api/customers/${customerId}`);
        if (!res.ok) throw new Error('Failed to fetch customer');

        const customer = await res.json();
        const foundBranch = customer.branches.find((b: Branch) => b.id === branchId);

        if (!foundBranch) {
          setError('Branch not found');
          setLoading(false);
          return;
        }

        setBranch(foundBranch);
        const data = {
          branchName: foundBranch.branchName || '',
          branchCode: foundBranch.branchCode || '',
          address: foundBranch.address || '',
          contactPerson: foundBranch.contactPerson || '',
          contactPhone: foundBranch.contactPhone || '',
          latitude: foundBranch.latitude,
          longitude: foundBranch.longitude,
        };
        setFormData(data);
        setInitialFormData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching branch:', err);
        setError('Failed to load branch data');
        setLoading(false);
      }
    }
    fetchBranch();
  }, [customerId, branchId]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(formData) !== JSON.stringify(initialFormData);

  const handleSave = async () => {
    // Validate required fields
    if (!formData.branchName.trim() || !formData.branchCode.trim()) {
      alert('Branch name and branch code are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${customerId}/branches/${branchId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update branch');
      }

      // Navigate back to customer page
      router.push(`/customers/${customerId}`);
    } catch (err: any) {
      console.error('Error saving branch:', err);
      alert(err.message || 'Failed to save changes');
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges && !confirm('Discard unsaved changes?')) return;
    router.push(`/customers/${customerId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading branch data...</p>
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Branch not found'}</p>
          <button
            onClick={() => router.push(`/customers/${customerId}`)}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Back to Customer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={handleCancel}
            className="text-indigo-600 hover:text-indigo-800 text-sm mb-2 flex items-center gap-1"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Customer
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Edit Branch: {branch.branchName}</h1>
        </div>
      </div>

      {/* Main Content - Grid Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">

          {/* LEFT: Map (60% - 3 cols) */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 md:sticky md:top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Branch Location</h2>
              <BranchLocationPickerFullPage
                address={formData.address}
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={(lat, lng) =>
                  setFormData({ ...formData, latitude: lat, longitude: lng })
                }
              />
            </div>
          </div>

          {/* RIGHT: Form (40% - 2 cols) */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Branch Details</h2>

              {/* Branch Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Branch Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.branchName}
                  onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  placeholder="Enter branch name"
                />
              </div>

              {/* Branch Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Branch Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.branchCode}
                  onChange={(e) => setFormData({ ...formData, branchCode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  placeholder="Enter branch code"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter branch address"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Enter the address and click "Resolve Location" in the map section to automatically find coordinates
                </p>
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter contact person name"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter contact phone number"
                />
              </div>

              {/* Unsaved Changes Indicator */}
              {hasUnsavedChanges && (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  ⚠️ You have unsaved changes
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-medium hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
