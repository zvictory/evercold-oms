"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Technician {
  id: string;
  name: string;
  specialization?: string;
}

interface Branch {
  id: string;
  branchCode: string;
  branchName: string;
  customerId?: string;
  customerName?: string;
  assignedTechs?: number;
  assignedTechnicianId?: string;
}

export default function BranchesList() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch branches
      const branchRes = await fetchWithAuth("/api/customer-branches", {
      });
      if (branchRes.ok) {
        const branchData = await branchRes.json();
        setBranches(branchData);
      }

      // Fetch technicians
      const techRes = await fetchWithAuth("/api/technicians", {
      });
      if (techRes.ok) {
        const techData = await techRes.json();
        setTechnicians(techData);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignTechnician(branchId: string, technicianId: string) {
    setSaving(branchId);
    try {
      const res = await fetchWithAuth(`/api/branches/${branchId}/technicians`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId }),
      });

      if (!res.ok) throw new Error("Failed to assign");

      // Update local state
      setBranches((prev) =>
        prev.map((b) =>
          b.id === branchId
            ? { ...b, assignedTechnicianId: technicianId }
            : b
        )
      );
    } catch (err: any) {
      setError(err.message || "Ошибка при назначении");
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <p className="mt-4 text-gray-600">Загрузка списка филиалов...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Филиалы</h2>
        <Link
          href="/admin/branches/create"
          className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
        >
          + Добавить филиал
        </Link>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-800">
          {error}
        </div>
      )}

      {branches.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">🏢</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Филиалы не найдены
          </h3>
          <p className="text-gray-600 mb-6">
            Используйте кнопку выше для добавления первого филиала
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">
                  Код
                </th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">
                  Имя филиала
                </th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">
                  Клиент
                </th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">
                  👨‍🔧 Назначенный техник
                </th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => {
                const assignedTech = technicians.find(
                  (t) => t.id === branch.assignedTechnicianId
                );
                return (
                  <tr key={branch.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="border border-gray-200 p-3 font-mono text-sm text-gray-900">
                      {branch.branchCode}
                    </td>
                    <td className="border border-gray-200 p-3 font-medium text-gray-900">
                      {branch.branchName}
                    </td>
                    <td className="border border-gray-200 p-3 text-sm text-gray-600">
                      {branch.customerName || "—"}
                    </td>
                    <td className="border border-gray-200 p-3">
                      <select
                        value={branch.assignedTechnicianId || ""}
                        onChange={(e) =>
                          handleAssignTechnician(branch.id, e.target.value)
                        }
                        disabled={saving === branch.id}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        <option value="">-- Не назначен --</option>
                        {technicians.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name}
                          </option>
                        ))}
                      </select>
                      {saving === branch.id && (
                        <p className="text-xs text-gray-500 mt-1">Сохранение...</p>
                      )}
                    </td>
                    <td className="border border-gray-200 p-3 text-sm">
                      {assignedTech && (
                        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          ✓ {assignedTech.name.split(" ")[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Quick Stats */}
      {branches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Всего филиалов</p>
            <p className="text-3xl font-bold text-blue-600">{branches.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Клиентов</p>
            <p className="text-3xl font-bold text-green-600">
              {new Set(branches.map((b) => b.customerId)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Назначено техников</p>
            <p className="text-3xl font-bold text-purple-600">
              {branches.reduce((sum, b) => sum + (b.assignedTechs || 0), 0)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
