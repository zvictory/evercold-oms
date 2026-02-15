'use client';

import { useState } from 'react';
import {
  buildYandexMultiStopUrl,
  openYandexNavigation,
  NavigationStop,
} from '@/lib/yandexNavigationHelper';

interface YandexNavigationButtonProps {
  stops: Array<{
    stopNumber: number;
    status: string;
    delivery: {
      order: {
        orderItems: Array<{
          branch: {
            latitude: number | null;
            longitude: number | null;
            deliveryAddress: string | null;
          } | null;
        }>;
      };
    };
  }>;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export function YandexNavigationButton({
  stops,
  className = '',
  variant = 'primary',
}: YandexNavigationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract valid stops with coordinates
  const validStops: NavigationStop[] = stops
    .filter(s => !['COMPLETED', 'FAILED', 'SKIPPED'].includes(s.status))
    .map(s => {
      const branch = s.delivery.order.orderItems.find(i => i.branch)?.branch;
      return {
        stopNumber: s.stopNumber,
        latitude: branch?.latitude ?? 0,
        longitude: branch?.longitude ?? 0,
        address: branch?.deliveryAddress ?? '',
      };
    })
    .filter(s => s.latitude !== 0 && s.longitude !== 0);

  // Count missing coordinates
  const totalPendingStops = stops.filter(
    s => !['COMPLETED', 'FAILED', 'SKIPPED'].includes(s.status)
  ).length;
  const missingCount = totalPendingStops - validStops.length;

  const handleNavigate = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = buildYandexMultiStopUrl(validStops, {
        useDepotAsStart: true,
        includeTraffic: true,
      });

      if (!result) {
        setError('Нет доступных координат');
        return;
      }

      openYandexNavigation(result.deepLink, result.webUrl);
    } catch (err) {
      setError('Ошибка открытия навигации');
      console.error('Navigation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const buttonClasses =
    variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200';

  return (
    <div className={className}>
      <button
        onClick={handleNavigate}
        disabled={validStops.length === 0 || loading}
        className={`w-full px-4 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses}`}
      >
        {loading ? '⏳ Открываем...' : '🧭 Открыть маршрут в Яндекс Навигаторе'}
      </button>

      {missingCount > 0 && (
        <p className="text-xs text-yellow-600 mt-2">
          ⚠️ Некоторые остановки без координат ({missingCount} из {totalPendingStops})
        </p>
      )}

      {error && <p className="text-xs text-red-600 mt-2">❌ {error}</p>}

      {validStops.length === 0 && totalPendingStops === 0 && (
        <p className="text-xs text-gray-500 mt-2">Все остановки завершены</p>
      )}
    </div>
  );
}
