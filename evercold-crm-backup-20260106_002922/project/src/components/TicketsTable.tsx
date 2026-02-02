"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  ticketNumber: string;
  status: string;
  priority: string;
  branchId: string;
  branch: { branchCode: string; branchName: string };
  category: { name: string };
  subcategory: { name: string };
  assignedTechnician?: { name: string };
  createdAt: string;
  firstResponseAt?: string;
  completedAt?: string;
}

export default function TicketsTable() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
  });

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  async function fetchTickets() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status !== "all") params.append("status", filters.status);
    if (filters.priority !== "all") params.append("priority", filters.priority);

    try {
      const res = await fetch(`/api/tickets?${params}`);
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status: string) {
    const colors: Record<string, string> = {
      NEW: "bg-gray-100 text-gray-800",
      ASSIGNED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CLOSED: "bg-gray-200 text-gray-900",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  }

  function getPriorityColor(priority: string) {
    const colors: Record<string, string> = {
      CRITICAL: "text-red-700 font-bold",
      HIGH: "text-orange-700 font-semibold",
      NORMAL: "text-blue-700",
      LOW: "text-gray-600",
    };
    return colors[priority] || "text-gray-600";
  }

  if (loading) return <div className="text-center py-8">Загрузка билетов...</div>;

  return (
    <div className="bg-white">
      <div className="mb-6 flex gap-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Статус</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все статусы</option>
            <option value="NEW">Новый</option>
            <option value="ASSIGNED">Назначен</option>
            <option value="IN_PROGRESS">В процессе</option>
            <option value="COMPLETED">Завершено</option>
            <option value="CLOSED">Закрыто</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">Приоритет</label>
          <select
            value={filters.priority}
            onChange={(e) =>
              setFilters({ ...filters, priority: e.target.value })
            }
            className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все приоритеты</option>
            <option value="CRITICAL">Критический</option>
            <option value="HIGH">Высокий</option>
            <option value="NORMAL">Средний</option>
            <option value="LOW">Низкий</option>
          </select>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Билеты не найдены
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border-collapse border border-gray-200">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">Билет №</th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">Филиал</th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">Проблема</th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">Техник</th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">Статус</th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">Приоритет</th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">Создан</th>
                <th className="border border-gray-200 p-3 text-left font-semibold text-gray-900">Действия</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 border-b border-gray-200">
                  <td className="border border-gray-200 p-3 font-mono text-sm text-gray-900">
                    {ticket.ticketNumber}
                  </td>
                  <td className="border border-gray-200 p-3">
                    <Link
                      href={`/dispatcher/tickets/${ticket.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {ticket.branch.branchCode}
                    </Link>
                  </td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-900">
                    {ticket.subcategory.name}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-900">
                    {ticket.assignedTechnician?.name || "—"}
                  </td>
                  <td className="border border-gray-200 p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {ticket.status}
                    </span>
                  </td>
                  <td className={`border border-gray-200 p-3 text-sm ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm text-gray-900">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-200 p-3 text-sm">
                    <Link
                      href={`/dispatcher/tickets/${ticket.id}`}
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
    </div>
  );
}
