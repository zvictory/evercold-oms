"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Technician {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialization?: string;
  assignedTickets?: number;
}

export default function TechniciansList() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Load technicians
  useEffect(() => {
    fetchTechnicians();
  }, []);

  async function fetchTechnicians() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/technicians");
      if (res.ok) {
        const data = await res.json();
        setTechnicians(data);
      } else if (res.status === 404) {
        // API doesn't exist yet, show empty state
        setTechnicians([]);
      } else {
        throw new Error("Failed to fetch technicians");
      }
    } catch (err: any) {
      setError(err.message);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <p className="mt-4 text-gray-600">Загрузка списка техников...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Список техников</h2>
        <Link
          href="/tech/create"
          className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700 transition"
        >
          + Добавить техника
        </Link>
      </div>

      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-800">
          <p className="font-medium">⚠️ Примечание:</p>
          <p className="text-sm mt-1">
            {error} - Используется демо-список техников. Нажмите "Добавить техника" чтобы
            создать реальных техников в системе.
          </p>
        </div>
      )}

      {technicians.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">👨‍🔧</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Техники не добавлены
          </h3>
          <p className="text-gray-600 mb-6">
            Начните с добавления первого техника в систему
          </p>
          <Link
            href="/tech/create"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded font-medium hover:bg-blue-700 transition"
          >
            Добавить первого техника
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">
                  Имя
                </th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">
                  Email
                </th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">
                  Телефон
                </th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">
                  Специализация
                </th>
                <th className="border border-gray-200 p-3 text-center font-semibold text-gray-900">
                  Активные билеты
                </th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {technicians.map((tech) => (
                <tr key={tech.id} className="hover:bg-gray-50 border-b border-gray-200">
                  <td className="border border-gray-200 p-3 font-medium text-gray-900">
                    {tech.name}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-600">
                    {tech.email || "—"}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-600">
                    {tech.phone || "—"}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-600">
                    {tech.specialization || "Универсальный"}
                  </td>
                  <td className="border border-gray-200 p-3 text-center">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {tech.assignedTickets || 0}
                    </span>
                  </td>
                  <td className="border border-gray-200 p-3 text-sm">
                    <Link
                      href={`/tech/${tech.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      Просмотр
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Demo Technicians Section */}
      {technicians.length === 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            📋 Демо-список доступных техников
          </h3>
          <p className="text-gray-600 mb-4">
            Система поставляется со следующими демо-техниками для тестирования:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: "Иван Смирнов",
                spec: "Компрессоры и холодильные установки",
              },
              {
                name: "Петр Волков",
                spec: "Электронные системы управления",
              },
              {
                name: "Сергей Иванов",
                spec: "Гидравлические системы",
              },
              {
                name: "Андрей Петров",
                spec: "Диагностика и тестирование",
              },
            ].map((tech, idx) => (
              <div
                key={idx}
                className="bg-gray-50 border border-gray-200 rounded p-4"
              >
                <p className="font-semibold text-gray-900">{tech.name}</p>
                <p className="text-sm text-gray-600 mt-1">{tech.spec}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded border border-blue-200">
            <p className="text-sm text-gray-700">
              💡 Эти техники используются автоматически при назначении, пока вы
              не создадите собственных техников. Нажмите "Добавить техника" выше,
              чтобы начать.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
