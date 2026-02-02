'use client';

import { useState, useCallback } from 'react';

export interface VerifiedItem {
  productId: string;
  orderItemId: string; // NEW
  productName: string;
  orderedQuantity: number; // Renamed from expectedQuantity
  deliveredQuantity: number; // NEW: replaces verifiedQuantity
  rejectedQuantity: number; // NEW
  rejectionReason?: 'MELTED' | 'PACKAGING_DAMAGED' | 'EXPIRED' | 'WRONG_PRODUCT' | 'INSUFFICIENT_STOCK' | 'CUSTOMER_REFUSED' | 'OTHER'; // NEW
  rejectionNotes?: string; // NEW
  unit: string;
  verified: boolean;
}

interface ItemVerificationProps {
  items: VerifiedItem[];
  onItemsChange?: (items: VerifiedItem[]) => void;
  onVerificationComplete?: (allVerified: boolean) => void;
}

const rejectionReasonLabels = {
  MELTED: '❄️ Товар растаял',
  PACKAGING_DAMAGED: '📦 Поврежденная упаковка',
  EXPIRED: '⏰ Истек срок годности',
  WRONG_PRODUCT: '🔄 Не тот товар',
  INSUFFICIENT_STOCK: '📉 Недостаточно на складе',
  CUSTOMER_REFUSED: '🚫 Клиент отказался',
  OTHER: '❓ Другое',
};

export function ItemVerification({
  items: initialItems,
  onItemsChange,
  onVerificationComplete,
}: ItemVerificationProps) {
  const [items, setItems] = useState<VerifiedItem[]>(initialItems);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  /**
   * Update delivered quantity
   */
  const updateDelivered = useCallback(
    (productId: string, quantity: number) => {
      const updated = items.map((item) => {
        if (item.productId !== productId) return item;

        const newDelivered = Math.max(0, Math.min(quantity, item.orderedQuantity));
        const newRejected = item.orderedQuantity - newDelivered;

        return {
          ...item,
          deliveredQuantity: newDelivered,
          rejectedQuantity: newRejected,
          verified: newDelivered + newRejected === item.orderedQuantity,
        };
      });

      setItems(updated);
      onItemsChange?.(updated);

      const allVerified = updated.every((item) => item.verified);
      onVerificationComplete?.(allVerified);
    },
    [items, onItemsChange, onVerificationComplete]
  );

  /**
   * Update rejected quantity
   */
  const updateRejected = useCallback(
    (productId: string, quantity: number) => {
      const updated = items.map((item) => {
        if (item.productId !== productId) return item;

        const newRejected = Math.max(0, Math.min(quantity, item.orderedQuantity));
        const newDelivered = item.orderedQuantity - newRejected;

        // Clear rejection reason if rejected quantity is 0
        const rejectionReason = newRejected === 0 ? undefined : item.rejectionReason;
        const rejectionNotes = newRejected === 0 ? undefined : item.rejectionNotes;

        return {
          ...item,
          deliveredQuantity: newDelivered,
          rejectedQuantity: newRejected,
          rejectionReason,
          rejectionNotes,
          verified: newDelivered + newRejected === item.orderedQuantity,
        };
      });

      setItems(updated);
      onItemsChange?.(updated);

      const allVerified = updated.every((item) => item.verified);
      onVerificationComplete?.(allVerified);
    },
    [items, onItemsChange, onVerificationComplete]
  );

  /**
   * Update rejection reason
   */
  const updateRejectionReason = useCallback(
    (productId: string, reason: string) => {
      const updated = items.map((item) =>
        item.productId === productId
          ? { ...item, rejectionReason: reason as any }
          : item
      );

      setItems(updated);
      onItemsChange?.(updated);
    },
    [items, onItemsChange]
  );

  /**
   * Update rejection notes
   */
  const updateRejectionNotes = useCallback(
    (productId: string, notes: string) => {
      const updated = items.map((item) =>
        item.productId === productId ? { ...item, rejectionNotes: notes } : item
      );

      setItems(updated);
      onItemsChange?.(updated);
    },
    [items, onItemsChange]
  );

  /**
   * Mark as correct (all delivered)
   */
  const markAsCorrect = useCallback(
    (productId: string) => {
      const updated = items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              deliveredQuantity: item.orderedQuantity,
              rejectedQuantity: 0,
              rejectionReason: undefined,
              rejectionNotes: undefined,
              verified: true,
            }
          : item
      );

      setItems(updated);
      onItemsChange?.(updated);

      const allVerified = updated.every((item) => item.verified);
      onVerificationComplete?.(allVerified);
    },
    [items, onItemsChange, onVerificationComplete]
  );

  /**
   * Mark as rejected (all rejected)
   */
  const markAsRejected = useCallback(
    (productId: string) => {
      const updated = items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              deliveredQuantity: 0,
              rejectedQuantity: item.orderedQuantity,
              verified: false, // Needs rejection reason
            }
          : item
      );

      setItems(updated);
      onItemsChange?.(updated);
      setExpandedItem(productId); // Auto-expand to select rejection reason
    },
    [items, onItemsChange]
  );

  /**
   * Validate item
   */
  const validateItem = useCallback((item: VerifiedItem): string[] => {
    const errors: string[] = [];

    // Quantities must sum to ordered
    if (item.deliveredQuantity + item.rejectedQuantity !== item.orderedQuantity) {
      errors.push('Доставлено + Отклонено должно равняться заказанному');
    }

    // No negative quantities
    if (item.deliveredQuantity < 0 || item.rejectedQuantity < 0) {
      errors.push('Количество не может быть отрицательным');
    }

    // Rejection reason required
    if (item.rejectedQuantity > 0 && !item.rejectionReason) {
      errors.push('Выберите причину отклонения');
    }

    // Notes required for OTHER
    if (item.rejectionReason === 'OTHER' && !item.rejectionNotes?.trim()) {
      errors.push('Опишите причину отклонения');
    }

    return errors;
  }, []);

  const verifiedCount = items.filter((item) => item.verified).length;
  const totalCount = items.length;
  const hasRejections = items.some((item) => item.rejectedQuantity > 0);
  const hasPartialDeliveries = items.some(
    (item) => item.deliveredQuantity > 0 && item.rejectedQuantity > 0
  );

  return (
    <div className="space-y-4">
      {/* Progress Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-blue-900">
            Проверено: {verifiedCount} / {totalCount}
          </span>
          <span className="text-sm text-blue-700">
            {Math.round((verifiedCount / totalCount) * 100)}%
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${(verifiedCount / totalCount) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Rejection Warning */}
      {hasRejections && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-orange-900">
            ⚠️ {hasPartialDeliveries ? 'Частичная доставка' : 'Товары отклонены'}
          </p>
          <p className="text-xs text-orange-700 mt-1">
            {hasPartialDeliveries
              ? 'Некоторые товары доставлены частично. Убедитесь, что указаны причины отклонения.'
              : 'Некоторые товары отклонены. Укажите причины для каждого.'}
          </p>
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {items.map((item) => {
          const errors = validateItem(item);
          const hasError = errors.length > 0;

          return (
            <div
              key={item.productId}
              className={`border rounded-lg p-4 transition ${
                item.verified && !hasError
                  ? 'bg-green-50 border-green-300'
                  : hasError
                  ? 'bg-red-50 border-red-300'
                  : 'bg-white border-gray-300'
              }`}
            >
              {/* Item Header */}
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() =>
                  setExpandedItem(expandedItem === item.productId ? null : item.productId)
                }
              >
                {/* Status Icon */}
                <div className="text-2xl">
                  {item.verified && !hasError
                    ? '✓'
                    : hasError
                    ? '⚠️'
                    : item.rejectedQuantity > 0
                    ? '🔻'
                    : '○'}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{item.productName}</p>
                  <p className="text-sm text-gray-600">
                    Заказано: {item.orderedQuantity} {item.unit}
                  </p>
                  {(item.deliveredQuantity > 0 || item.rejectedQuantity > 0) && (
                    <p className="text-sm mt-1">
                      <span className="text-green-600 font-medium">
                        ✓ {item.deliveredQuantity}
                      </span>
                      {item.rejectedQuantity > 0 && (
                        <>
                          {' • '}
                          <span className="text-red-600 font-medium">
                            ✕ {item.rejectedQuantity}
                          </span>
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Expand Arrow */}
                <div className="text-gray-400">
                  {expandedItem === item.productId ? '▼' : '▶'}
                </div>
              </div>

              {/* Validation Errors */}
              {hasError && (
                <div className="mt-2 px-3 py-2 bg-red-100 border border-red-300 rounded">
                  {errors.map((error, i) => (
                    <p key={i} className="text-xs text-red-700">
                      • {error}
                    </p>
                  ))}
                </div>
              )}

              {/* Expanded Details */}
              {expandedItem === item.productId && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {/* Quantity Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-gray-700">
                        Доставлено
                      </label>
                      <input
                        type="number"
                        value={item.deliveredQuantity}
                        onChange={(e) => updateDelivered(item.productId, +e.target.value || 0)}
                        min={0}
                        max={item.orderedQuantity}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-gray-700">
                        Отклонено
                      </label>
                      <input
                        type="number"
                        value={item.rejectedQuantity}
                        onChange={(e) => updateRejected(item.productId, +e.target.value || 0)}
                        min={0}
                        max={item.orderedQuantity}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {item.rejectedQuantity > 0 && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-semibold mb-2 block text-gray-700">
                          Причина отклонения *
                        </label>
                        <select
                          value={item.rejectionReason || ''}
                          onChange={(e) => updateRejectionReason(item.productId, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        >
                          <option value="">Выберите причину...</option>
                          {Object.entries(rejectionReasonLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {item.rejectionReason === 'OTHER' && (
                        <div>
                          <label className="text-sm font-semibold mb-2 block text-gray-700">
                            Опишите причину *
                          </label>
                          <textarea
                            value={item.rejectionNotes || ''}
                            onChange={(e) => updateRejectionNotes(item.productId, e.target.value)}
                            placeholder="Подробно опишите причину отклонения..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => markAsCorrect(item.productId)}
                      className="w-full py-2 bg-green-600 text-white text-sm rounded-lg font-bold hover:bg-green-700 transition"
                    >
                      ✓ Всё верно
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const half = Math.floor(item.orderedQuantity / 2);
                          updateDelivered(item.productId, half);
                        }}
                        className="py-2 bg-orange-600 text-white text-sm rounded-lg font-bold hover:bg-orange-700 transition"
                      >
                        ⚠️ Частично
                      </button>
                      <button
                        onClick={() => markAsRejected(item.productId)}
                        className="py-2 bg-red-600 text-white text-sm rounded-lg font-bold hover:bg-red-700 transition"
                      >
                        ✕ Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-200">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-600">{totalCount}</p>
          <p className="text-xs text-gray-600">Всего</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
          <p className="text-xs text-gray-600">Проверено</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-orange-600">
            {items.filter((i) => i.deliveredQuantity > 0 && i.rejectedQuantity > 0).length}
          </p>
          <p className="text-xs text-gray-600">Частично</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-red-600">
            {items.filter((i) => i.rejectedQuantity > 0).length}
          </p>
          <p className="text-xs text-gray-600">Отклонено</p>
        </div>
      </div>
    </div>
  );
}
