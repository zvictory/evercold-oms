'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeliveryCardProps {
  delivery: {
    id: string;
    routeName: string;
    isStandalone?: boolean;
    status: string;
    vehicle: {
      plateNumber: string;
      model: string;
    };
    stops: Array<{
      id: string;
      delivery: {
        id: string;
        status: string;
        order: {
          orderNumber: string;
          customer: {
            name: string;
          };
          orderItems: Array<{
            branch: {
              branchName: string;
              fullName?: string;
              deliveryAddress: string;
              phone: string;
              contactPerson?: string;
              latitude?: number;
              longitude?: number;
            } | null;
            product: {
              name: string;
              unit: string;
            };
            quantity: number;
          }>;
        };
      };
    }>;
  };
  variant?: 'compact' | 'detailed';
  onStartDelivery?: (deliveryId: string) => void;
}

export function DeliveryCard({ delivery, variant = 'compact', onStartDelivery }: DeliveryCardProps) {
  const router = useRouter();
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Get first stop (for standalone deliveries, there's only one)
  const firstStop = delivery.stops[0];
  if (!firstStop) return null;

  const order = firstStop.delivery.order;
  const orderItems = order.orderItems;

  // Get first branch with valid address
  const firstBranch = getFirstBranch(orderItems);

  // Customer/Branch name
  const displayName = firstBranch?.branchName || firstBranch?.fullName || order.customer.name;

  // Products list
  const productsToShow = showAllProducts ? orderItems : orderItems.slice(0, 3);
  const hasMoreProducts = orderItems.length > 3;

  // Status badge
  const statusBadge = getStatusBadge(firstStop.delivery.status);

  // Handle navigation to maps
  const handleNavigate = () => {
    if (firstBranch?.latitude && firstBranch?.longitude) {
      // Try Yandex Maps first (common in Kazakhstan), fallback to Google Maps
      const yandexUrl = `https://yandex.com/maps/?pt=${firstBranch.longitude},${firstBranch.latitude}&z=16`;
      const googleUrl = `https://www.google.com/maps/search/?api=1&query=${firstBranch.latitude},${firstBranch.longitude}`;

      // Use Yandex for mobile, Google for desktop
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      window.open(isMobile ? yandexUrl : googleUrl, '_blank');
    } else if (firstBranch?.deliveryAddress) {
      // Fallback: search by address
      const encodedAddress = encodeURIComponent(firstBranch.deliveryAddress);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  // Handle phone call
  const handleCall = () => {
    if (firstBranch?.phone) {
      window.location.href = `tel:${firstBranch.phone}`;
    }
  };

  // Handle start delivery
  const handleStart = () => {
    if (onStartDelivery) {
      onStartDelivery(delivery.id);
    } else {
      router.push(`/driver/routes/${delivery.id}`);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-base sm:text-lg font-bold text-gray-900">
              🏢 {displayName}
            </h3>
            {delivery.isStandalone && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                Разовая доставка
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm text-gray-600">Заказ #{order.orderNumber}</p>
            <span className={`px-2 py-1 text-xs font-semibold rounded ${statusBadge.className}`}>
              {statusBadge.text}
            </span>
          </div>
        </div>
      </div>

      {/* Address */}
      {firstBranch?.deliveryAddress && (
        <div className="mb-3 bg-gray-50 rounded-lg p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-gray-600 mb-1">📍 Адрес доставки</p>
              <p className="text-sm font-medium text-gray-900">{firstBranch.deliveryAddress}</p>
            </div>
            {(firstBranch.latitude || firstBranch.deliveryAddress) && (
              <button
                onClick={handleNavigate}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition whitespace-nowrap"
              >
                🧭 Навигация
              </button>
            )}
          </div>
        </div>
      )}

      {/* Contact Info */}
      {(firstBranch?.contactPerson || firstBranch?.phone) && (
        <div className="mb-3 flex items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">👤</span>
            <span className="text-gray-900">
              {firstBranch.contactPerson || 'Контакт'}
            </span>
          </div>
          {firstBranch.phone && (
            <button
              onClick={handleCall}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition"
            >
              📱 Позвонить
            </button>
          )}
        </div>
      )}

      {/* Products */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-600">
            📦 Товары ({orderItems.length} {orderItems.length === 1 ? 'позиция' : 'позиций'})
          </p>
          {hasMoreProducts && (
            <button
              onClick={() => setShowAllProducts(!showAllProducts)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {showAllProducts ? 'Скрыть ▲' : `Показать все ▼`}
            </button>
          )}
        </div>
        <div className="space-y-1">
          {productsToShow.map((item, idx) => (
            <div key={idx} className="text-sm text-gray-700 flex justify-between">
              <span>• {item.product.name}</span>
              <span className="font-medium">
                {item.quantity} {item.product.unit}
              </span>
            </div>
          ))}
          {!showAllProducts && hasMoreProducts && (
            <p className="text-xs text-gray-500 italic">
              ... + ещё {orderItems.length - 3}
            </p>
          )}
        </div>
      </div>

      {/* Vehicle */}
      <div className="mb-3 text-sm text-gray-600">
        🚚 {delivery.vehicle.plateNumber} • {delivery.vehicle.model}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleStart}
          className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition"
        >
          ▶️ Начать доставку
        </button>
        <button
          onClick={() => router.push(`/driver/routes/${delivery.id}`)}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition"
        >
          📋
        </button>
      </div>
    </div>
  );
}

// Helper function to get first branch with valid address
function getFirstBranch(
  orderItems: Array<{
    branch: {
      branchName: string;
      fullName?: string;
      deliveryAddress: string;
      phone: string;
      contactPerson?: string;
      latitude?: number;
      longitude?: number;
    } | null;
    product: any;
    quantity: number;
  }>
) {
  // Find first item with branch that has address
  const itemWithAddress = orderItems.find(
    (item) => item.branch && item.branch.deliveryAddress
  );

  return itemWithAddress?.branch || orderItems[0]?.branch || null;
}

// Helper function to get status badge styling
function getStatusBadge(status: string): { text: string; className: string } {
  switch (status) {
    case 'PENDING':
      return {
        text: 'ОЖИДАЕТ',
        className: 'bg-gray-100 text-gray-700',
      };
    case 'IN_TRANSIT':
      return {
        text: 'В ПУТИ',
        className: 'bg-blue-100 text-blue-700',
      };
    case 'DELIVERED':
      return {
        text: 'ДОСТАВЛЕНО',
        className: 'bg-green-100 text-green-700',
      };
    case 'FAILED':
      return {
        text: 'НЕ ДОСТАВЛЕНО',
        className: 'bg-red-100 text-red-700',
      };
    default:
      return {
        text: status,
        className: 'bg-gray-100 text-gray-700',
      };
  }
}
