'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, RefreshCw, Filter, Calendar, FileText } from 'lucide-react';
import DatePicker from '@/components/DatePicker';

interface EdoIntegration {
  id: string;
  name: string;
  provider: string;
}

interface EdoSync {
  id: string;
  documentType: string;
  documentNumber: string | null;
  externalId: string | null;
  status: string;
  direction: string;
  errorMessage: string | null;
  syncedAt: string | null;
  createdAt: string;
  integration: {
    id: string;
    name: string;
    provider: string;
  };
  order: {
    id: string;
    orderNumber: string;
  } | null;
}

export default function EdoSyncDashboard() {
  const [integrations, setIntegrations] = useState<EdoIntegration[]>([]);
  const [syncs, setSyncs] = useState<EdoSync[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    documentType: '',
    status: '',
    direction: '',
  });

  useEffect(() => {
    loadIntegrations();
    loadSyncs();
  }, []);

  const loadIntegrations = async () => {
    try {
      const response = await fetchWithAuth('/api/edo/integrations', {
      });
      const data = await response.json();
      setIntegrations(data.integrations || []);
      if (data.integrations?.length > 0) {
        setSelectedIntegration(data.integrations[0].id);
      }
    } catch (error) {
      console.error('Failed to load integrations:', error);
    }
  };

  const loadSyncs = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth('/api/edo/sync/status', {
      });
      const data = await response.json();
      setSyncs(data.syncs || []);
    } catch (error) {
      console.error('Failed to load syncs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedIntegration) {
      alert('Please select an integration');
      return;
    }

    setDownloading(true);
    try {
      const params = new URLSearchParams({
        integrationId: selectedIntegration,
        ...(filters.fromDate && { fromDate: filters.fromDate }),
        ...(filters.toDate && { toDate: filters.toDate }),
        ...(filters.documentType && { documentType: filters.documentType }),
      });

      const response = await fetchWithAuth(`/api/edo/sync/download?${params}`, {
      });
      const data = await response.json();

      if (data.success) {
        alert(`✅ Downloaded ${data.count} documents`);
        await loadSyncs();
      } else {
        alert(`❌ Download failed: ${data.error}`);
      }
    } catch (error: any) {
      alert(`❌ Download failed: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced':
        return 'bg-green-100 text-green-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDirectionIcon = (direction: string) => {
    return direction === 'upload' ? (
      <Upload className="h-4 w-4 text-blue-600" />
    ) : (
      <Download className="h-4 w-4 text-green-600" />
    );
  };

  const filteredSyncs = syncs.filter((sync) => {
    if (filters.status && sync.status !== filters.status) return false;
    if (filters.direction && sync.direction !== filters.direction) return false;
    if (filters.documentType && sync.documentType !== filters.documentType) return false;
    return true;
  });

  const stats = {
    total: syncs.length,
    synced: syncs.filter((s) => s.status === 'synced').length,
    failed: syncs.filter((s) => s.status === 'failed').length,
    pending: syncs.filter((s) => s.status === 'pending' || s.status === 'syncing').length,
    uploads: syncs.filter((s) => s.direction === 'upload').length,
    downloads: syncs.filter((s) => s.direction === 'download').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">EDO Sync Dashboard</h1>
          <p className="text-gray-600 mt-1">
            View and manage document synchronization with EDO systems
          </p>
        </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Total</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Synced</div>
          <div className="text-2xl font-bold text-green-600">{stats.synced}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Failed</div>
          <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Uploads</div>
          <div className="text-2xl font-bold text-blue-600">{stats.uploads}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-600">Downloads</div>
          <div className="text-2xl font-bold text-green-600">{stats.downloads}</div>
        </div>
      </div>

      {/* Download Section */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Download className="h-6 w-6" />
          Download Documents from EDO
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Integration</label>
            <select
              value={selectedIntegration}
              onChange={(e) => setSelectedIntegration(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              {integrations.map((integration) => (
                <option key={integration.id} value={integration.id}>
                  {integration.name} ({integration.provider})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">From Date</label>
            <DatePicker
              value={filters.fromDate}
              onChange={(date) => setFilters({ ...filters, fromDate: date })}
              placeholder="Начальная дата"
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">To Date</label>
            <DatePicker
              value={filters.toDate}
              onChange={(date) => setFilters({ ...filters, toDate: date })}
              placeholder="Конечная дата"
              className="w-full border rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Document Type</label>
            <select
              value={filters.documentType}
              onChange={(e) => setFilters({ ...filters, documentType: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="order">Order</option>
              <option value="invoice">Invoice</option>
              <option value="act">Act</option>
              <option value="waybill">Waybill</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleDownload}
              disabled={downloading || !selectedIntegration}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2"
            >
              {downloading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5" />
          <h3 className="font-semibold">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="syncing">Syncing</option>
              <option value="synced">Synced</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Direction</label>
            <select
              value={filters.direction}
              onChange={(e) => setFilters({ ...filters, direction: e.target.value })}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Directions</option>
              <option value="upload">Upload</option>
              <option value="download">Download</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={loadSyncs}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Sync Records */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : filteredSyncs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No sync records</h3>
          <p className="text-gray-600">Upload or download documents to see sync history</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Direction
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Integration
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Document
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    External ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Synced At
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSyncs.map((sync) => (
                  <tr key={sync.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getDirectionIcon(sync.direction)}
                        <span className="text-sm capitalize">{sync.direction}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium">{sync.integration.name}</div>
                        <div className="text-gray-500 text-xs">
                          {sync.integration.provider}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium capitalize">{sync.documentType}</div>
                        {sync.documentNumber && (
                          <div className="text-gray-500 text-xs">{sync.documentNumber}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {sync.order ? (
                        <a
                          href={`/orders/${sync.order.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {sync.order.orderNumber}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                          sync.status
                        )}`}
                      >
                        {sync.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {sync.externalId ? (
                        <span className="text-sm font-mono text-gray-600">
                          {sync.externalId.substring(0, 8)}...
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sync.syncedAt ? (
                        <span className="text-sm text-gray-600">
                          {new Date(sync.syncedAt).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sync.errorMessage ? (
                        <span className="text-sm text-red-600" title={sync.errorMessage}>
                          {sync.errorMessage.substring(0, 30)}...
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
