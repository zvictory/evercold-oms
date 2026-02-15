'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/locales/client';
import { resolveDisplayBranch } from '@/lib/utils';
import { LicensePlate } from '@/components/ui/license-plate';

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
            _count?: { branches: number };
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
  const t = useI18n();
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
  const displayName = resolveDisplayBranch(
    firstBranch?.branchName || firstBranch?.fullName,
    order.customer.name,
    order.customer._count?.branches
  );

  // Products list
  const productsToShow = showAllProducts ? orderItems : orderItems.slice(0, 3);
  const hasMoreProducts = orderItems.length > 3;

  // Calculate totals
  const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const remainingCount = orderItems.length - 3;

  // Status badge
  const statusBadge = getStatusBadge(firstStop.delivery.status, t);

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
    <div className="border border-slate-200 rounded-lg p-3 bg-white hover:shadow-md transition">
      {/* HEADER ROW - customer name + status + quick actions (ONE LINE) */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h3 className="text-sm font-bold text-slate-900 truncate">
            🏢 {displayName}
          </h3>
          {delivery.isStandalone && (
            <span className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border border-purple-200 rounded font-semibold whitespace-nowrap">
              {t('Driver.route.standaloneDelivery')}
            </span>
          )}
        </div>
        {/* Quick actions inline */}
        <div className="flex gap-1 shrink-0">
          <button
            onClick={handleNavigate}
            className="p-1.5 bg-sky-100 text-sky-700 rounded hover:bg-sky-200 transition"
            title={t('Driver.actions.navigate')}
          >
            🧭
          </button>
          {firstBranch?.phone && (
            <button
              onClick={handleCall}
              className="p-1.5 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 transition"
              title={t('Driver.route.call')}
            >
              📱
            </button>
          )}
        </div>
      </div>

      {/* ORDER INFO + STATUS (ONE LINE) */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-600">
          {(t as any)('Driver.route.orderNumber', { number: order.orderNumber })}
        </p>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${statusBadge.className}`}>
          {statusBadge.text}
        </span>
      </div>

      {/* Address Section - Compact */}
      {firstBranch?.deliveryAddress && (
        <div className="mb-2 bg-slate-50 rounded p-2">
          <p className="text-[10px] text-slate-500 mb-0.5">
            📍 {(t as any)('Driver.delivery.deliveryAddress')}
          </p>
          <p className="text-xs text-slate-900 leading-tight line-clamp-2">
            {firstBranch.deliveryAddress}
          </p>
        </div>
      )}

      {/* CONTACT + VEHICLE (ONE LINE) */}
      <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
        <span className="truncate">
          👤 {firstBranch?.contactPerson || t('Driver.delivery.contact')}
        </span>
        <LicensePlate
          plateNumber={delivery.vehicle.plateNumber}
          size="sm"
          className="ml-2"
        />
      </div>

      {/* Products - Collapsed by default */}
      <div className="mb-2">
        <button
          onClick={() => setShowAllProducts(!showAllProducts)}
          className="flex items-center justify-between w-full text-xs text-slate-600 mb-1"
        >
          <span>
            📦 {(t as any)('Driver.delivery.products')} ({orderItems.length})
          </span>
          <span className="text-[10px]">{showAllProducts ? '▲' : '▼'}</span>
        </button>

        {showAllProducts ? (
          <div className="space-y-0.5">
            {orderItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs text-slate-700">
                <span className="truncate">• {item.product.name}</span>
                <span className="font-medium whitespace-nowrap ml-2">
                  {item.quantity} {item.product.unit}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-700 leading-tight">
            {orderItems.slice(0, 2).map(i => i.product.name).join(', ')}
            {orderItems.length > 2 && (
              <span className="text-slate-500"> +{orderItems.length - 2} {(t as any)('Driver.delivery.more')}</span>
            )}
          </p>
        )}
      </div>

      {/* PRIMARY ACTION BUTTON */}
      <button
        onClick={handleStart}
        className="w-full py-2 bg-sky-600 text-white text-sm font-bold rounded-lg hover:bg-sky-700 transition"
      >
        ▶️ {(t as any)('Driver.delivery.confirm')}
      </button>
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
function getStatusBadge(status: string, t: any): { text: string; className: string } {
  switch (status) {
    case 'PENDING':
      return {
        text: (t as any)('Driver.status.pending'),
        className: 'bg-slate-100 text-slate-700',
      };
    case 'IN_TRANSIT':
      return {
        text: (t as any)('Driver.status.inTransit'),
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'DELIVERED':
      return {
        text: (t as any)('Driver.status.delivered'),
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'FAILED':
      return {
        text: (t as any)('Driver.status.failed'),
        className: 'bg-red-50 text-red-700 border-red-200',
      };
    default:
      return {
        text: status,
        className: 'bg-slate-100 text-slate-700',
      };
  }
}
