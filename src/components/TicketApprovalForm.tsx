"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Part {
  name: string;
  quantity: number;
  unitCost: number;
  total?: number;
}

interface Photo {
  url: string;
  caption?: string;
  type?: string;
}

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

export default function TicketApprovalForm({
  completionId,
  completion,
}: {
  completionId: string;
  completion: Completion;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  let parts: Part[] = [];
  let photos: Photo[] = [];

  try {
    parts = JSON.parse(completion.partsJson);
  } catch {
    parts = [];
  }

  try {
    photos = JSON.parse(completion.photosJson);
  } catch {
    photos = [];
  }

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/completions/${completionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (!res.ok) throw new Error("Failed to approve");

      alert("Услуга успешно одобрена!");
      router.back();
    } catch (error) {
      console.error(error);
      alert("Не удалось одобрить услугу");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      alert("Пожалуйста, укажите причину пересмотра");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/completions/${completionId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          reason: rejectionReason,
        }),
      });

      if (!res.ok) throw new Error("Failed to reject");

      alert("Услуга отклонена. Техник внесет исправления.");
      router.back();
    } catch (error) {
      console.error(error);
      alert("Не удалось отклонить услугу");
    } finally {
      setLoading(false);
    }
  }

  const statusColorMap: Record<string, string> = {
    PENDING: "text-yellow-700",
    APPROVED: "text-green-700",
    REJECTED: "text-red-700",
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Проверка завершения услуги</h2>

      {/* Work Description */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">Выполненная работа</h3>
        <p className="bg-gray-50 p-4 rounded border border-gray-200 text-sm leading-relaxed text-gray-900">
          {completion.workDescription}
        </p>
      </div>

      {/* Photos */}
      {photos.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Фотографии</h3>
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo: Photo, idx: number) => (
              <div key={idx} className="border border-gray-200 rounded overflow-hidden bg-gray-50">
                <img
                  src={photo.url}
                  alt={photo.caption || `Photo ${idx + 1}`}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f3f4f6' width='100' height='100'/%3E%3Ctext x='50' y='50' font-size='14' text-anchor='middle' dy='.3em' fill='%239ca3af'%3EImage Error%3C/text%3E%3C/svg%3E";
                  }}
                />
                {photo.caption && (
                  <p className="text-xs p-2 bg-white border-t border-gray-200 text-gray-900">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Parts List */}
      {parts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-gray-900">Использованные детали</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 p-2 text-left font-semibold text-gray-900">Деталь</th>
                  <th className="border border-gray-200 p-2 text-right font-semibold text-gray-900">Кол-во</th>
                  <th className="border border-gray-200 p-2 text-right font-semibold text-gray-900">Цена за единицу</th>
                  <th className="border border-gray-200 p-2 text-right font-semibold text-gray-900">Итого</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part: Part, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="border border-gray-200 p-2 text-gray-900">{part.name}</td>
                    <td className="border border-gray-200 p-2 text-right text-gray-900">{part.quantity}</td>
                    <td className="border border-gray-200 p-2 text-right text-gray-900">
                      {part.unitCost.toLocaleString()}
                    </td>
                    <td className="border border-gray-200 p-2 text-right font-semibold text-gray-900">
                      {(part.total || part.quantity * part.unitCost).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cost Summary */}
      <div className="mb-8 bg-blue-50 p-6 rounded border-2 border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Сводка стоимости</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-900">Стоимость деталей:</span>
            <span className="font-semibold text-gray-900">
              {completion.partsCost.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-900">
              Трудовые затраты ({completion.laborHours}ч × {completion.laborCostPerHour}/ч):
            </span>
            <span className="font-semibold text-gray-900">
              {completion.laborCost.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-blue-300 pt-2 flex justify-between text-base font-bold">
            <span className="text-gray-900">Общая стоимость:</span>
            <span className="text-blue-700">
              {completion.totalCost.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Approval Status */}
      <div className="mb-8 p-4 bg-gray-50 rounded border border-gray-200">
        <p className="text-sm text-gray-900">
          Статус:{" "}
          <span
            className={`font-semibold ${statusColorMap[completion.approvalStatus] || "text-gray-700"}`}
          >
            {completion.approvalStatus}
          </span>
        </p>
      </div>

      {/* Action Buttons */}
      {completion.approvalStatus === "PENDING" && (
        <div className="space-y-4">
          {!showRejectForm ? (
            <div className="flex gap-4">
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded font-medium hover:bg-green-700 disabled:opacity-50 transition"
              >
                {loading ? "Обработка..." : "✓ Одобрить услугу"}
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-3 rounded font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                ✗ Запросить исправление
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-red-50 rounded border border-red-200">
              <label className="block text-sm font-medium text-gray-700">
                Причина пересмотра
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Опишите, что нужно исправить или улучшить..."
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50 transition text-sm font-medium"
                >
                  Отправить на исправление
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason("");
                  }}
                  disabled={loading}
                  className="flex-1 bg-gray-400 text-white py-2 rounded hover:bg-gray-500 disabled:opacity-50 transition text-sm font-medium"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {completion.approvalStatus !== "PENDING" && (
        <div className="bg-gray-100 p-4 rounded text-center border border-gray-200">
          <p className="font-semibold text-gray-900">
            Эта услуга {completion.approvalStatus === "APPROVED" ? "одобрена" : "отклонена"}
          </p>
        </div>
      )}
    </div>
  );
}
