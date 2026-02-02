"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import TechnicianAssignment from "@/components/TechnicianAssignment";

interface Ticket {
  id: string;
  ticketNumber: string;
  status: string;
  priority: string;
  branchId: string;
  branch: { id: string; branchCode: string; branchName: string };
  category: { id: string; name: string };
  subcategory: { id: string; name: string };
  description: string;
  assignedTechnicianId?: string;
  assignedTechnician?: { id: string; name: string };
  createdAt: string;
  firstResponseAt?: string;
  completedAt?: string;
  closedAt?: string;
  completion?: {
    id: string;
    workDescription: string;
    laborHours: number;
    laborCost: number;
    partsCost: number;
    totalCost: number;
    approvalStatus: string;
  };
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`/api/tickets/${ticketId}`);
        if (!res.ok) throw new Error("Не удалось загрузить билет");
        const data = await res.json();
        setTicket(data);
      } catch (err: any) {
        setError(err.message || "Ошибка загрузки");
      } finally {
        setLoading(false);
      }
    }

    if (ticketId) fetchTicket();
  }, [ticketId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка билета...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dispatcher/tickets"
            className="text-blue-600 hover:text-blue-800 mb-4 block"
          >
            ← Вернуться к билетам
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Ошибка</h2>
            <p className="text-red-700">{error || "Билет не найден"}</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      NEW: "bg-gray-100 text-gray-800",
      ASSIGNED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CLOSED: "bg-gray-200 text-gray-900",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      CRITICAL: "text-red-700 font-bold",
      HIGH: "text-orange-700 font-semibold",
      NORMAL: "text-blue-700",
      LOW: "text-gray-600",
    };
    return colors[priority] || "text-gray-600";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/dispatcher/tickets"
            className="text-blue-600 hover:text-blue-800 mb-6 block font-medium"
          >
            ← Вернуться к билетам
          </Link>

          <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {ticket.ticketNumber}
                </h1>
                <p className="text-gray-600 mt-1">
                  {ticket.branch.branchCode} - {ticket.branch.branchName}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  {ticket.status === "NEW" && "Новый"}
                  {ticket.status === "ASSIGNED" && "Назначен"}
                  {ticket.status === "IN_PROGRESS" && "В процессе"}
                  {ticket.status === "COMPLETED" && "Завершено"}
                  {ticket.status === "CLOSED" && "Закрыто"}
                </span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Категория
              </h3>
              <p className="text-gray-900">{ticket.category.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Подкатегория
              </h3>
              <p className="text-gray-900">{ticket.subcategory.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Приоритет
              </h3>
              <p className={getPriorityColor(ticket.priority)}>
                {ticket.priority === "CRITICAL" && "Критический"}
                {ticket.priority === "HIGH" && "Высокий"}
                {ticket.priority === "NORMAL" && "Средний"}
                {ticket.priority === "LOW" && "Низкий"}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Назначенный техник
              </h3>
              <p className="text-gray-900">
                {ticket.assignedTechnician?.name || "—"}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Описание проблемы
            </h3>
            <p className="bg-gray-50 p-4 rounded border text-gray-900">
              {ticket.description}
            </p>
          </div>

          <TechnicianAssignment
            ticketId={ticketId}
            currentTechnicianId={ticket.assignedTechnicianId}
            currentTechnicianName={ticket.assignedTechnician?.name}
            onAssignmentComplete={() => {
              // Refresh the page to show updated assignment
              window.location.reload();
            }}
          />

          <div className="grid md:grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-1">
                Создан
              </h3>
              <p className="text-gray-900">
                {new Date(ticket.createdAt).toLocaleString("ru-RU")}
              </p>
            </div>
            {ticket.firstResponseAt && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Первый ответ
                </h3>
                <p className="text-gray-900">
                  {new Date(ticket.firstResponseAt).toLocaleString("ru-RU")}
                </p>
              </div>
            )}
            {ticket.completedAt && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Завершен
                </h3>
                <p className="text-gray-900">
                  {new Date(ticket.completedAt).toLocaleString("ru-RU")}
                </p>
              </div>
            )}
            {ticket.closedAt && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Закрыт
                </h3>
                <p className="text-gray-900">
                  {new Date(ticket.closedAt).toLocaleString("ru-RU")}
                </p>
              </div>
            )}
          </div>

          {ticket.completion && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-lg font-bold mb-4">Информация о завершении</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Выполненная работа
                  </h3>
                  <p className="text-gray-900">
                    {ticket.completion.workDescription}
                  </p>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Стоимость деталей
                    </h3>
                    <p className="text-gray-900">
                      {ticket.completion.partsCost.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Трудовые затраты
                    </h3>
                    <p className="text-gray-900">
                      {ticket.completion.laborCost.toLocaleString()} (
                      {ticket.completion.laborHours}ч)
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Общая стоимость
                    </h3>
                    <p className="text-lg font-bold text-green-700">
                      {ticket.completion.totalCost.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">
                    Статус одобрения
                  </h3>
                  <p
                    className={`font-semibold ${
                      ticket.completion.approvalStatus === "APPROVED"
                        ? "text-green-700"
                        : ticket.completion.approvalStatus === "REJECTED"
                        ? "text-red-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {ticket.completion.approvalStatus === "PENDING" &&
                      "Ожидание"}
                    {ticket.completion.approvalStatus === "APPROVED" &&
                      "Одобрено"}
                    {ticket.completion.approvalStatus === "REJECTED" &&
                      "Отклонено"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
