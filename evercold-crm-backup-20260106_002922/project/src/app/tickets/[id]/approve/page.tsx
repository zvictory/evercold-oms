"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TicketApprovalForm from "@/components/TicketApprovalForm";

interface Completion {
  id: string;
  workDescription: string;
  laborHours: number;
  laborCostPerHour: number;
  partsJson: string;
  photosJson: string;
  partsCost: number;
  laborCost: number;
  totalCost: number;
  approvalStatus: string;
}

interface Ticket {
  id: string;
  completion?: Completion;
}

export default function ApprovalPage() {
  const params = useParams();
  const ticketId = params.id as string;
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompletion() {
      try {
        // Fetch the ticket with its completion
        const res = await fetch(`/api/tickets/${ticketId}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch ticket: ${res.statusText}`);
        }

        const ticket: Ticket = await res.json();

        if (ticket.completion) {
          setCompletion(ticket.completion);
        } else {
          setError("Для этого билета не найдена служба завершения");
        }
      } catch (error: any) {
        console.error("Error fetching completion:", error);
        setError(error.message || "Не удалось загрузить данные завершения");
      } finally {
        setLoading(false);
      }
    }

    if (ticketId) {
      fetchCompletion();
    }
  }, [ticketId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
              <p className="mt-4 text-gray-600">Загрузка деталей завершения услуги...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !completion) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-red-900 mb-2">Ошибка</h2>
              <p className="text-red-700">
                {error || "Для этого билета не найдена информация о завершении"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <button
            onClick={() => window.history.back()}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            ← Назад
          </button>
        </div>
        <TicketApprovalForm completionId={completion.id} completion={completion} />
      </div>
    </div>
  );
}
