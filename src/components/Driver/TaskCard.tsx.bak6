'use client';

import { useRouter } from 'next/navigation';

interface TaskCardProps {
  task: {
    id: string;
    orderNumber: string;
    customerName: string;
    branchName?: string;
    branchCode?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    contactPerson?: string;
    phone?: string;
    items: Array<{
      product: { name: string; unit: string };
      quantity: number;
    }>;
    status: string;
    deliveryId: string;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();

  const handleNavigate = () => {
    if (task.latitude && task.longitude) {
      const yandexUrl = `https://yandex.com/maps/?pt=${task.longitude},${task.latitude}&z=16`;
      const googleUrl = `https://www.google.com/maps/search/?api=1&query=${task.latitude},${task.longitude}`;
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      window.open(isMobile ? yandexUrl : googleUrl, '_blank');
    } else if (task.address) {
      const encodedAddress = encodeURIComponent(task.address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  const handleCall = () => {
    if (task.phone) {
      window.location.href = `tel:${task.phone}`;
    }
  };

  const getStatusBadge = () => {
    switch (task.status) {
      case 'PENDING':
        return { text: 'Готов к доставке', className: 'bg-gray-100 text-gray-700' };
      case 'IN_TRANSIT':
        return { text: 'В процессе', className: 'bg-blue-100 text-blue-700' };
      default:
        return { text: task.status, className: 'bg-gray-100 text-gray-700' };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">
          🏢 {task.customerName}
        </h3>
        {task.branchName && (
          <span className="text-xs sm:text-sm text-gray-600 ml-2">
            {task.branchCode || task.branchName}
          </span>
        )}
      </div>

      {/* Address */}
      {task.address && (
        <div className="mb-3 bg-gray-50 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-600 mb-1">📍 Адрес доставки</p>
              <p className="text-sm font-medium text-gray-900">{task.address}</p>
            </div>
            <button
              onClick={handleNavigate}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition whitespace-nowrap"
            >
              🧭 Навигация
            </button>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="mb-3">
        <p className="text-xs text-gray-600 mb-2">📦 Товары</p>
        <div className="space-y-1">
          {task.items.slice(0, 5).map((item, idx) => (
            <div key={idx} className="text-sm text-gray-700 flex justify-between">
              <span>• {item.product.name}</span>
              <span className="font-medium">
                {item.quantity} {item.product.unit}
              </span>
            </div>
          ))}
          {task.items.length > 5 && (
            <p className="text-xs text-gray-500 italic">
              ...+ ещё {task.items.length - 5}
            </p>
          )}
        </div>
      </div>

      {/* Contact */}
      {(task.contactPerson || task.phone) && (
        <div className="mb-3 flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">👤</span>
            <span className="text-gray-900">{task.contactPerson || 'Контакт'}</span>
          </div>
          {task.phone && (
            <button
              onClick={handleCall}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition"
            >
              📱 Позвонить
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <span className={`px-2 py-1 text-xs font-semibold rounded ${statusBadge.className}`}>
          {statusBadge.text}
        </span>
        <button
          onClick={() => router.push(`/driver/delivery/${task.deliveryId}`)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition"
        >
          Открыть заказ
        </button>
      </div>
    </div>
  );
}
