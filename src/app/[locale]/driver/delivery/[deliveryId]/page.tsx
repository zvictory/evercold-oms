'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ItemVerification, VerifiedItem } from '@/components/Driver/ItemVerification';
import { PhotoCapture } from '@/components/Driver/PhotoCapture';
import { SignatureCanvas } from '@/components/Driver/SignatureCanvas';

interface OrderItem {
  id: string;
  productId: string;
  sapCode: string;
  quantity: number;
  unit: string;
  product?: {
    id: string;
    name: string;
    unit: string;
  };
}

interface Delivery {
  id: string;
  orderId: string;
  status: string;
  order: {
    orderNumber: string;
    customer: {
      name: string;
    };
    orderItems: OrderItem[];
  };
}

interface Photo {
  url: string;
  photoType: string;
  caption?: string;
}

const issueCategories = [
  { value: 'customer_absent', label: '👤 Клиент отсутствует' },
  { value: 'wrong_address', label: '📍 Неверный адрес' },
  { value: 'damaged_goods', label: '📦 Поврежденный товар' },
  { value: 'access_denied', label: '🚫 Доступ запрещен' },
  { value: 'delivery_refused', label: '❌ Доставка отказана' },
  { value: 'other', label: '❓ Другое' },
];

export default function DeliveryChecklistPage() {
  const router = useRouter();
  const params = useParams();
  const deliveryId = params.deliveryId as string;

  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [verifiedItems, setVerifiedItems] = useState<VerifiedItem[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [issueCategory, setIssueCategory] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [itemsVerificationComplete, setItemsVerificationComplete] = useState(false);

  // Load delivery data
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const response = await fetch(`/api/deliveries/${deliveryId}`);
        if (!response.ok) throw new Error('Failed to fetch delivery');

        const data = await response.json();
        setDelivery(data);

        // Initialize verified items from order items
        const initialItems: VerifiedItem[] = data.order.orderItems.map((item: OrderItem) => ({
          orderItemId: item.id,
          productId: item.productId,
          productName: item.product?.name || `Product ${item.sapCode}`,
          orderedQuantity: item.quantity,
          deliveredQuantity: 0,
          rejectedQuantity: 0,
          unit: item.product?.unit || item.unit,
          verified: false,
        }));

        setVerifiedItems(initialItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load delivery');
      } finally {
        setLoading(false);
      }
    };

    if (deliveryId) {
      fetchDelivery();
    }
  }, [deliveryId]);

  /**
   * Handle step progression
   */
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return itemsVerificationComplete;
      case 2:
        return photos.length > 0;
      case 3:
        return signatureUrl && recipientName.trim();
      case 4:
        return true; // Notes are optional
      default:
        return false;
    }
  };

  const handleNextStep = () => {
    if (canProceedToNextStep() && currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  /**
   * Submit delivery checklist
   */
  const handleSubmit = async () => {
    if (!delivery || submitting) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`/api/deliveries/${deliveryId}/checklist/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryItems: verifiedItems,
          photos,
          signatureUrl,
          recipientName,
          issueCategory: issueCategory || undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete delivery');
      }

      const result = await response.json();

      // Show success message
      alert('✅ Доставка успешно завершена!');

      // Redirect back to routes page
      router.push('/driver/routes');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete delivery';
      setError(message);
      alert(`❌ Ошибка: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка доставки...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h1 className="text-lg font-bold text-red-900 mb-2">Ошибка</h1>
          <p className="text-red-700 mb-4">{error || 'Доставка не найдена'}</p>
          <button
            onClick={() => router.push('/driver/routes')}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Вернуться к маршрутам
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            ← Вернуться
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 mb-2">
            <span>✅</span> Завершить доставку
          </h1>

          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Заказ:</span> {delivery.order.orderNumber}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Клиент:</span> {delivery.order.customer.name}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 sm:h-3 rounded-full transition ${step <= currentStep
                    ? step === currentStep
                      ? 'bg-indigo-600'
                      : 'bg-green-600'
                    : 'bg-slate-200'
                  }`}
              />
            ))}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Шаг {currentStep} из 5
          </p>
        </div>

        {/* Wizard Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
          {/* Step 1: Items Verification */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                1️⃣ Проверка товаров
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Укажите количество доставленных и отклоненных товаров
              </p>
              <ItemVerification
                items={verifiedItems}
                onItemsChange={setVerifiedItems}
                onVerificationComplete={setItemsVerificationComplete}
              />
            </div>
          )}

          {/* Step 2: Photo Capture */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                2️⃣ Фотографии
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Сделайте фото доставленного товара и доказательства доставки
              </p>
              <PhotoCapture
                checklistId={deliveryId}
                onPhotoAdded={(photo) => setPhotos([...photos, {
                  url: photo.url,
                  photoType: photo.photoType || 'proof_of_delivery',
                  caption: photo.caption
                }])}
                onError={(err) => setError(err)}
              />
              {photos.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Фотографий загружено: {photos.length}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Digital Signature */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                3️⃣ Цифровая подпись
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Получите подпись получателя товара
              </p>
              <SignatureCanvas
                recipientName={recipientName}
                onRecipientNameChange={setRecipientName}
                onSignatureSaved={setSignatureUrl}
                onError={(err) => setError(err)}
              />
              {signatureUrl && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Подпись получена от: {recipientName}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Notes & Issues */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                4️⃣ Проблемы и примечания
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                Выберите категорию проблемы (если есть) и добавьте примечания
              </p>

              <div className="space-y-4">
                {/* Issue Category */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Категория проблемы (опционально)
                  </label>
                  <div className="space-y-2">
                    {issueCategories.map((category) => (
                      <label key={category.value} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <input
                          type="radio"
                          name="issueCategory"
                          value={category.value}
                          checked={issueCategory === category.value}
                          onChange={(e) => setIssueCategory(e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-slate-700">{category.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Примечания (опционально)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Добавьте дополнительную информацию о доставке..."
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                5️⃣ Проверка и отправка
              </h2>

              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-200">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">ТОВАРЫ</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      {verifiedItems.filter((i) => i.verified).length} / {verifiedItems.length} проверено
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 font-medium">ФОТОГРАФИИ</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      {photos.length} загружено
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 font-medium">ПОДПИСЬ</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      {recipientName || 'Не получена'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 font-medium">ПРОБЛЕМЫ</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      {issueCategory
                        ? issueCategories.find((c) => c.value === issueCategory)?.label || issueCategory
                        : 'Нет'}
                    </p>
                  </div>
                </div>

                {/* Delivered Summary */}
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-xs text-green-700 font-medium mb-2">ДОСТАВЛЕНО / ОТКЛОНЕНО</p>
                  <div className="space-y-1">
                    {verifiedItems.map((item) => (
                      <p key={item.productId} className="text-sm text-green-700">
                        <span className="font-semibold">{item.productName}:</span> {item.deliveredQuantity} ✓
                        {item.rejectedQuantity > 0 && ` | ${item.rejectedQuantity} ✕`}
                      </p>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            ← Назад
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNextStep}
              disabled={!canProceedToNextStep()}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
            >
              Далее →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canProceedToNextStep()}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
            >
              {submitting ? '⏳ Отправка...' : '✓ Завершить доставку'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
