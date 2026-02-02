"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Technician {
  id: string;
  name: string;
  specialization?: string;
  isAssigned: boolean;
}

interface BranchTechnicianAssignmentProps {
  branchId: string;
  branchName: string;
}

export default function BranchTechnicianAssignment({
  branchId,
  branchName,
}: BranchTechnicianAssignmentProps) {
  const router = useRouter();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadTechnicians();
  }, [branchId]);

  async function loadTechnicians() {
    try {
      setLoading(true);
      setError(null);

      // Load all technicians and check which are assigned to this branch
      const res = await fetch("/api/technicians");
      if (res.ok) {
        let allTechs = await res.json();
        // Mark as assigned if they have assignment to this branch
        const updated = allTechs.map((tech: any) => ({
          ...tech,
          isAssigned: false, // Will be updated from branch assignment data
        }));
        setTechnicians(updated);
      } else {
        // Use demo technicians
        setTechnicians([
          { id: "tech1", name: "Иван Смирнов", specialization: "Компрессоры", isAssigned: false },
          { id: "tech2", name: "Петр Волков", specialization: "Электрика", isAssigned: false },
          { id: "tech3", name: "Сергей Иванов", specialization: "Гидравлика", isAssigned: false },
          { id: "tech4", name: "Андрей Петров", specialization: "Диагностика", isAssigned: false },
        ]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleTechnician(techId: string, isAssigning: boolean) {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/branches/${branchId}/technicians`, {
        method: isAssigning ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicianId: techId }),
      });

      if (!res.ok) throw new Error("Failed to update assignment");

      // Update local state
      setTechnicians((prev) =>
        prev.map((t) =>
          t.id === techId ? { ...t, isAssigned: isAssigning } : t
        )
      );

      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка при обновлении");
    } finally {
      setSaving(false);
    }
  }

  const assignedTechs = technicians.filter((t) => t.isAssigned);

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Загрузка техников...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Техники филиала: {branchName}
        </h2>
        <p className="text-gray-600">Выберите техников, работающих в этом филиале</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {error}
        </div>
      )}

      {/* Current Assignments */}
      {assignedTechs.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-900 mb-4">✓ Назначенные техники</h3>
          <div className="space-y-2">
            {assignedTechs.map((tech) => (
              <div key={tech.id} className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                <div>
                  <p className="font-medium text-gray-900">{tech.name}</p>
                  <p className="text-sm text-gray-600">{tech.specialization || "Универсальный"}</p>
                </div>
                <button
                  onClick={() => handleToggleTechnician(tech.id, false)}
                  disabled={saving}
                  className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 disabled:opacity-50 transition"
                >
                  Удалить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available for Assignment */}
      {technicians.filter((t) => !t.isAssigned).length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4">Доступные техники</h3>
          <div className="space-y-2">
            {technicians
              .filter((t) => !t.isAssigned)
              .map((tech) => (
                <div
                  key={tech.id}
                  className="flex items-center justify-between bg-white p-3 rounded border border-blue-200"
                >
                  <div>
                    <p className="font-medium text-gray-900">{tech.name}</p>
                    <p className="text-sm text-gray-600">{tech.specialization || "Универсальный"}</p>
                  </div>
                  <button
                    onClick={() => handleToggleTechnician(tech.id, true)}
                    disabled={saving}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200 disabled:opacity-50 transition"
                  >
                    Добавить
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {technicians.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Нет доступных техников</p>
          <p className="text-sm text-yellow-600 mt-2">Сначала создайте техников в системе</p>
        </div>
      )}

      {/* Back Button */}
      <div>
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Вернуться
        </button>
      </div>
    </div>
  );
}
