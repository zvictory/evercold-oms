"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Technician {
  id: string;
  name: string;
  email?: string;
}

interface TechnicianAssignmentProps {
  ticketId: string;
  currentTechnicianId?: string;
  currentTechnicianName?: string;
  onAssignmentComplete?: () => void;
}

export default function TechnicianAssignment({
  ticketId,
  currentTechnicianId,
  currentTechnicianName,
  onAssignmentComplete,
}: TechnicianAssignmentProps) {
  const router = useRouter();
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(
    currentTechnicianId || ""
  );
  const [loading, setLoading] = useState(false);
  const [loadingTechs, setLoadingTechs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Load available technicians
  useEffect(() => {
    async function loadTechnicians() {
      try {
        setLoadingTechs(true);
        // For now, we'll fetch from a technicians endpoint
        // If it doesn't exist, we'll show a demo list
        const res = await fetch("/api/technicians");
        if (res.ok) {
          const data = await res.json();
          setTechnicians(data);
        } else {
          // Demo technicians (replace with actual API call)
          setTechnicians([
            { id: "tech1", name: "Иван Смирнов" },
            { id: "tech2", name: "Петр Волков" },
            { id: "tech3", name: "Сергей Иванов" },
            { id: "tech4", name: "Андрей Петров" },
          ]);
        }
      } catch (err) {
        // Use demo data if API fails
        setTechnicians([
          { id: "tech1", name: "Иван Смирнов" },
          { id: "tech2", name: "Петр Волков" },
          { id: "tech3", name: "Сергей Иванов" },
          { id: "tech4", name: "Андрей Петров" },
        ]);
      } finally {
        setLoadingTechs(false);
      }
    }

    loadTechnicians();
  }, []);

  async function handleAutoAssign() {
    setLoading(true);
    setError(null);

    try {
      // Auto-assign to the first available technician
      const availableTech = technicians[0];
      if (!availableTech) {
        setError("Нет доступных техников");
        setLoading(false);
        return;
      }

      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTechnicianId: availableTech.id,
        }),
      });

      if (!res.ok) throw new Error("Failed to assign technician");

      setSelectedTechnicianId(availableTech.id);
      setShowForm(false);
      if (onAssignmentComplete) onAssignmentComplete();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка назначения");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualAssign() {
    if (!selectedTechnicianId) {
      setError("Пожалуйста, выберите техника");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTechnicianId: selectedTechnicianId,
        }),
      });

      if (!res.ok) throw new Error("Failed to assign technician");

      setShowForm(false);
      if (onAssignmentComplete) onAssignmentComplete();
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Ошибка назначения");
    } finally {
      setLoading(false);
    }
  }

  if (loadingTechs) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <p className="text-gray-700">Загрузка списка техников...</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Назначение техника
          </h3>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Текущее назначение:</p>
              <p className="text-lg font-semibold text-blue-700">
                {currentTechnicianName ? (
                  <span className="flex items-center gap-2">
                    ✓ {currentTechnicianName}
                  </span>
                ) : (
                  <span className="text-orange-600">Не назначен</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
          >
            {currentTechnicianId ? "Переназначить" : "Назначить"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-6 pt-6 border-t border-blue-200 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Выберите техника
            </label>
            <select
              value={selectedTechnicianId}
              onChange={(e) => setSelectedTechnicianId(e.target.value)}
              disabled={loading}
              className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Выберите техника --</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleManualAssign}
              disabled={loading || !selectedTechnicianId}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Назначение..." : "Назначить вручную"}
            </button>
            <button
              onClick={handleAutoAssign}
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Назначение..." : "Авто-назначить"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setError(null);
                setSelectedTechnicianId(currentTechnicianId || "");
              }}
              disabled={loading}
              className="px-4 py-2 rounded font-medium bg-gray-300 text-gray-900 hover:bg-gray-400 disabled:opacity-50 transition"
            >
              Отмена
            </button>
          </div>

          <div className="mt-4 p-3 bg-white rounded border border-blue-200 text-sm text-gray-700">
            <p className="font-medium mb-2">💡 Как это работает:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                <strong>Назначить вручную:</strong> Выберите конкретного техника
                из списка
              </li>
              <li>
                <strong>Авто-назначить:</strong> Система автоматически выберет
                первого доступного техника
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
