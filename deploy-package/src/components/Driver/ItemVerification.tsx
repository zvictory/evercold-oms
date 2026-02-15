'use client';

import { useState, useCallback } from 'react';
import { useI18n } from '@/locales/client';

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

export function ItemVerification({
  items: initialItems,
  onItemsChange,
  onVerificationComplete,
}: ItemVerificationProps) {
  const t = useI18n();

  const rejectionReasonLabels: Record<string, string> = {
    MELTED: t('Driver.delivery.wizard.itemVerification.rejectionReasons.melted'),
    PACKAGING_DAMAGED: t('Driver.delivery.wizard.itemVerification.rejectionReasons.packagingDamaged'),
    EXPIRED: t('Driver.delivery.wizard.itemVerification.rejectionReasons.expired'),
    WRONG_PRODUCT: t('Driver.delivery.wizard.itemVerification.rejectionReasons.wrongProduct'),
    INSUFFICIENT_STOCK: t('Driver.delivery.wizard.itemVerification.rejectionReasons.insufficientStock'),
    CUSTOMER_REFUSED: t('Driver.delivery.wizard.itemVerification.rejectionReasons.customerRefused'),
    OTHER: t('Driver.delivery.wizard.itemVerification.rejectionReasons.other'),
  };
  const [items, setItems] = useState<VerifiedItem[]>(initialItems);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  /**
   * Accept all items as delivered successfully
   * ✓ Optimistic delivery: assumes 100% success by default
   */
  const handleAcceptAll = useCallback(() => {
    const allDelivered = items.map((item) => ({
      ...item,
      deliveredQuantity: item.orderedQuantity,
      rejectedQuantity: 0,
      rejectionReason: undefined,
      rejectionNotes: undefined,
      verified: true,
    }));

    setItems(allDelivered);
    onItemsChange?.(allDelivered);
    onVerificationComplete?.(true);
  }, [items, onItemsChange, onVerificationComplete]);

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
      errors.push(t('Driver.delivery.wizard.itemVerification.validationSum'));
    }

    // No negative quantities
    if (item.deliveredQuantity < 0 || item.rejectedQuantity < 0) {
      errors.push(t('Driver.delivery.wizard.itemVerification.validationNegative'));
    }

    // Rejection reason required
    if (item.rejectedQuantity > 0 && !item.rejectionReason) {
      errors.push(t('Driver.delivery.wizard.itemVerification.validationReason'));
    }

    // Notes required for OTHER
    if (item.rejectionReason === 'OTHER' && !item.rejectionNotes?.trim()) {
      errors.push(t('Driver.delivery.wizard.itemVerification.validationOtherNotes'));
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
      {/* Accept All Button - Only if not all verified */}
      {verifiedCount < totalCount && (
        <button
          onClick={handleAcceptAll}
          className="w-full py-4 bg-emerald-600 text-white text-base font-bold rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-2"
        >
          <span className="text-xl">✓</span>
          <span>{t('Driver.delivery.wizard.itemVerification.acceptAll')}</span>
        </button>
      )}

      {/* Progress Summary - Changes color when 100% complete */}
      <div
        className={`border rounded-lg p-4 transition ${
          verifiedCount === totalCount
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-blue-50 border-blue-200'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={`text-sm font-semibold ${
              verifiedCount === totalCount ? 'text-emerald-900' : 'text-blue-900'
            }`}
          >
            {verifiedCount === totalCount ? '✓ ' : ''}
            {t('Driver.delivery.wizard.itemVerification.verified')} {verifiedCount} / {totalCount}
          </span>
          <span
            className={`text-sm ${
              verifiedCount === totalCount ? 'text-emerald-700' : 'text-blue-700'
            }`}
          >
            {Math.round((verifiedCount / totalCount) * 100)}%
          </span>
        </div>
        <div
          className={`w-full rounded-full h-2 ${
            verifiedCount === totalCount ? 'bg-emerald-200' : 'bg-blue-200'
          }`}
        >
          <div
            className={`h-2 rounded-full transition-all ${
              verifiedCount === totalCount ? 'bg-emerald-600' : 'bg-blue-600'
            }`}
            style={{ width: `${(verifiedCount / totalCount) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Rejection Warning */}
      {hasRejections && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <p className="text-sm font-semibold text-orange-900">
            ⚠️ {hasPartialDeliveries ? t('Driver.delivery.wizard.itemVerification.partialDelivery') : t('Driver.delivery.wizard.itemVerification.itemsRejected')}
          </p>
          <p className="text-xs text-orange-700 mt-1">
            {hasPartialDeliveries
              ? t('Driver.delivery.wizard.itemVerification.partialDeliveryHint')
              : t('Driver.delivery.wizard.itemVerification.rejectedHint')}
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
                  ? 'bg-emerald-50 border-emerald-200'
                  : hasError && expandedItem === item.productId
                  ? 'bg-red-50 border-red-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              {/* Item Header */}
              <div className="flex items-center gap-3">
                {/* Status Icon - Larger, more prominent */}
                <div className="text-3xl">
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
                  <p className="font-semibold text-slate-900 truncate">{item.productName}</p>
                  <p className="text-sm text-slate-600">
                    {t('Driver.delivery.wizard.itemVerification.ordered')} {item.orderedQuantity} {item.unit}
                  </p>
                  {item.verified && !hasError && (
                    <p className="text-xs text-emerald-600 font-medium mt-1">
                      {t('Driver.delivery.wizard.itemVerification.deliveredFull')}
                    </p>
                  )}
                </div>

                {/* Edit Button (instead of expand arrow) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedItem(expandedItem === item.productId ? null : item.productId);
                  }}
                  className="px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 whitespace-nowrap"
                >
                  {expandedItem === item.productId ? t('Driver.delivery.wizard.itemVerification.hide') : t('Driver.delivery.wizard.itemVerification.edit')}
                </button>
              </div>

              {/* Validation Errors - Only show when expanded */}
              {hasError && expandedItem === item.productId && (
                <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded">
                  {errors.map((error, i) => (
                    <p key={i} className="text-xs text-red-700">
                      • {error}
                    </p>
                  ))}
                </div>
              )}

              {/* Expanded Details */}
              {expandedItem === item.productId && (
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                  {/* Quantity Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-slate-700">
                        {t('Driver.delivery.wizard.itemVerification.delivered')}
                      </label>
                      <input
                        type="number"
                        value={item.deliveredQuantity}
                        onChange={(e) => updateDelivered(item.productId, +e.target.value || 0)}
                        min={0}
                        max={item.orderedQuantity}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-green-600"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold mb-2 block text-slate-700">
                        {t('Driver.delivery.wizard.itemVerification.rejected')}
                      </label>
                      <input
                        type="number"
                        value={item.rejectedQuantity}
                        onChange={(e) => updateRejected(item.productId, +e.target.value || 0)}
                        min={0}
                        max={item.orderedQuantity}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-center font-semibold focus:outline-none focus:ring-2 focus:ring-red-600"
                      />
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {item.rejectedQuantity > 0 && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-semibold mb-2 block text-slate-700">
                          {t('Driver.delivery.wizard.itemVerification.rejectionReason')}
                        </label>
                        <select
                          value={item.rejectionReason || ''}
                          onChange={(e) => updateRejectionReason(item.productId, e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                        >
                          <option value="">{t('Driver.delivery.wizard.itemVerification.selectReason')}</option>
                          {Object.entries(rejectionReasonLabels).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {item.rejectionReason === 'OTHER' && (
                        <div>
                          <label className="text-sm font-semibold mb-2 block text-slate-700">
                            {t('Driver.delivery.wizard.itemVerification.describeReason')}
                          </label>
                          <textarea
                            value={item.rejectionNotes || ''}
                            onChange={(e) => updateRejectionNotes(item.productId, e.target.value)}
                            placeholder={t('Driver.delivery.wizard.itemVerification.describeReasonPlaceholder')}
                            rows={3}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
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
                      {t('Driver.delivery.wizard.itemVerification.allCorrect')}
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          const half = Math.floor(item.orderedQuantity / 2);
                          updateDelivered(item.productId, half);
                        }}
                        className="py-2 bg-orange-600 text-white text-sm rounded-lg font-bold hover:bg-orange-700 transition"
                      >
                        {t('Driver.delivery.wizard.itemVerification.partial')}
                      </button>
                      <button
                        onClick={() => markAsRejected(item.productId)}
                        className="py-2 bg-red-600 text-white text-sm rounded-lg font-bold hover:bg-red-700 transition"
                      >
                        {t('Driver.delivery.wizard.itemVerification.reject')}
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
      <div className="grid grid-cols-4 gap-3 pt-4 border-t border-slate-200">
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums text-slate-600">{totalCount}</p>
          <p className="text-xs text-slate-600">{t('Driver.delivery.wizard.itemVerification.statsTotal')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums text-green-600">{verifiedCount}</p>
          <p className="text-xs text-slate-600">{t('Driver.delivery.wizard.itemVerification.statsVerified')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums text-orange-600">
            {items.filter((i) => i.deliveredQuantity > 0 && i.rejectedQuantity > 0).length}
          </p>
          <p className="text-xs text-slate-600">{t('Driver.delivery.wizard.itemVerification.statsPartial')}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums text-red-600">
            {items.filter((i) => i.rejectedQuantity > 0).length}
          </p>
          <p className="text-xs text-slate-600">{t('Driver.delivery.wizard.itemVerification.statsRejected')}</p>
        </div>
      </div>
    </div>
  );
}
