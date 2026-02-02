'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PhotoCapture } from '@/components/Driver/PhotoCapture';
import { SignatureCanvas } from '@/components/Driver/SignatureCanvas';
import { ItemVerification, VerifiedItem } from '@/components/Driver/ItemVerification';
import { UploadedPhoto } from '@/lib/photoUploadService';

interface DeliveryChecklistPageProps {}

interface ChecklistState {
  verifiedItems: VerifiedItem[];
  signatureUrl?: string;
  recipientName?: string;
  photos: UploadedPhoto[];
  issueCategory?: string;
  notes: string;
  isSubmitting: boolean;
  error?: string;
  success: boolean;
}

const issueCategories = [
  { value: 'recipient_absent', label: '👤 Получатель отсутствует' },
  { value: 'wrong_address', label: '📍 Неверный адрес' },
  { value: 'damaged_goods', label: '📦 Повреждённый товар' },
  { value: 'access_issue', label: '🚫 Доступ запрещён' },
  { value: 'refused', label: '❌ Отказ от доставки' },
  { value: 'other', label: '❓ Другое' },
];

export default function DeliveryChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const deliveryId = params.deliveryId as string;

  const [state, setState] = useState<ChecklistState>({
    verifiedItems: [],
    photos: [],
    notes: '',
    isSubmitting: false,
    success: false,
  });

  const [currentStep, setCurrentStep] = useState<
    'items' | 'photos' | 'signature' | 'notes' | 'review'
  >('items');

  const [allItemsVerified, setAllItemsVerified] = useState(false);

  /**
   * Load delivery data
   */
  useEffect(() => {
    const loadDelivery = async () => {
      try {
        const response = await fetch(`/api/deliveries/${deliveryId}`);
        if (!response.ok) throw new Error('Failed to load delivery');

        const data = await response.json();
        const delivery = data.delivery;

        // Extract items from order
        const items: VerifiedItem[] = delivery.order.orderItems.map(
          (item: any) => ({
            productId: item.productId,
            productName: item.product.name,
            expectedQuantity: item.quantity,
            verifiedQuantity: item.quantity,
            unit: item.product.unit || 'шт',
            verified: false,
          })
        );

        setState((prev) => ({ ...prev, verifiedItems: items }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: `Failed to load delivery: ${error instanceof Error ? error.message : 'Unknown error'}`,
        }));
      }
    };

    loadDelivery();
  }, [deliveryId]);

  /**
   * Handle items verification
   */
  const handleItemsChange = useCallback((items: VerifiedItem[]) => {
    setState((prev) => ({ ...prev, verifiedItems: items }));
  }, []);

  /**
   * Handle verification complete
   */
  const handleVerificationComplete = useCallback((allVerified: boolean) => {
    setAllItemsVerified(allVerified);
  }, []);

  /**
   * Handle photo added
   */
  const handlePhotoAdded = useCallback((photo: UploadedPhoto) => {
    setState((prev) => ({
      ...prev,
      photos: [...prev.photos, photo],
    }));
  }, []);

  /**
   * Handle signature saved
   */
  const handleSignatureSaved = useCallback((signatureUrl: string) => {
    setState((prev) => ({
      ...prev,
      signatureUrl,
    }));
  }, []);

  /**
   * Submit checklist
   */
  const submitChecklist = useCallback(async () => {
    if (!state.signatureUrl) {
      setState((prev) => ({
        ...prev,
        error: 'Подпись обязательна',
      }));
      return;
    }

    try {
      setState((prev) => ({ ...prev, isSubmitting: true, error: undefined }));

      const response = await fetch(`/api/deliveries/${deliveryId}/checklist/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifiedItems: state.verifiedItems,
          photos: state.photos.map((p) => ({
            url: p.url,
            type: p.photoType,
            caption: p.caption,
          })),
          signatureUrl: state.signatureUrl,
          recipientName: state.recipientName,
          issueCategory: state.issueCategory,
          notes: state.notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit checklist');
      }

      setState((prev) => ({ ...prev, success: true }));

      // Redirect after success
      setTimeout(() => {
        router.push(`/driver/routes`);
      }, 2000);
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `Failed to submit: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
    } finally {
      setState((prev) => ({ ...prev, isSubmitting: false }));
    }
  }, [deliveryId, state, router]);

  if (state.error && !state.isSubmitting) {
    return (
      <div className="w-full min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
          <p className="text-red-600 font-semibold mb-4 text-sm sm:text-base">{state.error}</p>
          <button
            onClick={() => router.push('/driver/routes')}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-sm sm:text-base"
          >
            Назад к маршрутам
          </button>
        </div>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="w-full min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full text-center">
          <div className="text-4xl sm:text-5xl mb-4">✓</div>
          <h1 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">Доставка завершена!</h1>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">Спасибо за заполнение чек-листа</p>
          <p className="text-xs sm:text-sm text-gray-500">Перенаправление...</p>
        </div>
      </div>
    );
  }

  const steps = [
    { id: 'items', label: '📦 Товары', icon: '1' },
    { id: 'photos', label: '📸 Фото', icon: '2' },
    { id: 'signature', label: '✍️ Подпись', icon: '3' },
    { id: 'notes', label: '📝 Заметки', icon: '4' },
    { id: 'review', label: '✓ Проверка', icon: '5' },
  ];

  return (
    <div className="w-full min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-indigo-600 text-white p-3 sm:p-4 sticky top-0 z-10">
        <h1 className="text-base sm:text-lg font-bold">Подтверждение доставки</h1>
        <p className="text-indigo-100 text-xs sm:text-sm mt-1">Заполните все разделы для завершения доставки</p>
      </div>

      {/* Steps Indicator */}
      <div className="bg-white border-b px-2 sm:px-4 py-2 sm:py-3 sticky top-12 sm:top-14 z-10">
        <div className="flex justify-between">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id as any)}
              className={`flex flex-col items-center gap-1 flex-1 ${
                currentStep === step.id ? 'text-indigo-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
                  currentStep === step.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {step.icon}
              </div>
              <span className="text-xs hidden sm:block">{step.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 pb-24">
        {/* Items Step */}
        {currentStep === 'items' && (
          <div className="bg-white rounded-lg p-3 sm:p-4 space-y-4">
            <ItemVerification
              items={state.verifiedItems}
              onItemsChange={handleItemsChange}
              onVerificationComplete={handleVerificationComplete}
            />

            <div className="flex gap-2 pt-4">
              <button
                onClick={() => setCurrentStep('photos')}
                disabled={!allItemsVerified}
                className="flex-1 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400 text-sm sm:text-base"
              >
                Далее: Фото →
              </button>
            </div>
          </div>
        )}

        {/* Photos Step */}
        {currentStep === 'photos' && (
          <div className="bg-white rounded-lg p-3 sm:p-4 space-y-4">
            <PhotoCapture
              checklistId={deliveryId}
              onPhotoAdded={handlePhotoAdded}
              onError={(error) => setState((prev) => ({ ...prev, error }))}
            />

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <button
                onClick={() => setCurrentStep('items')}
                className="flex-1 py-2 sm:py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 text-sm sm:text-base"
              >
                ← Назад
              </button>
              <button
                onClick={() => setCurrentStep('signature')}
                className="flex-1 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 text-sm sm:text-base"
              >
                Далее: Подпись →
              </button>
            </div>
          </div>
        )}

        {/* Signature Step */}
        {currentStep === 'signature' && (
          <div className="bg-white rounded-lg p-3 sm:p-4 space-y-4">
            <SignatureCanvas
              recipientName={state.recipientName}
              onSignatureSaved={handleSignatureSaved}
              onRecipientNameChange={(name) =>
                setState((prev) => ({ ...prev, recipientName: name }))
              }
              onError={(error) => setState((prev) => ({ ...prev, error }))}
            />

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <button
                onClick={() => setCurrentStep('photos')}
                className="flex-1 py-2 sm:py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 text-sm sm:text-base"
              >
                ← Назад
              </button>
              <button
                onClick={() => setCurrentStep('notes')}
                disabled={!state.signatureUrl}
                className="flex-1 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:bg-gray-400 text-sm sm:text-base"
              >
                Далее: Заметки →
              </button>
            </div>
          </div>
        )}

        {/* Notes Step */}
        {currentStep === 'notes' && (
          <div className="bg-white rounded-lg p-3 sm:p-4 space-y-4">
            {/* Issue Category */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2">
                Есть проблемы? (Опционально)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {issueCategories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() =>
                      setState((prev) => ({ ...prev, issueCategory: category.value }))
                    }
                    className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition ${
                      state.issueCategory === category.value
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold mb-2">
                Дополнительные заметки (Опционально)
              </label>
              <textarea
                value={state.notes}
                onChange={(e) => setState((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Добавьте комментарии или замечания..."
                rows={4}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <button
                onClick={() => setCurrentStep('signature')}
                className="flex-1 py-2 sm:py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 text-sm sm:text-base"
              >
                ← Назад
              </button>
              <button
                onClick={() => setCurrentStep('review')}
                className="flex-1 py-2 sm:py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 text-sm sm:text-base"
              >
                Далее: Проверка →
              </button>
            </div>
          </div>
        )}

        {/* Review Step */}
        {currentStep === 'review' && (
          <div className="bg-white rounded-lg p-3 sm:p-4 space-y-4">
            <h2 className="text-base sm:text-lg font-bold">Проверка чек-листа</h2>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                <p className="text-xs text-blue-600">Проверено</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-900">
                  {state.verifiedItems.filter((i) => i.verified).length} /
                  {state.verifiedItems.length}
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
                <p className="text-xs text-green-600">Фото</p>
                <p className="text-xl sm:text-2xl font-bold text-green-900">{state.photos.length}</p>
              </div>
            </div>

            {/* Issue Summary */}
            {state.issueCategory && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 sm:p-3">
                <p className="text-xs sm:text-sm font-semibold text-orange-900">
                  ⚠️ Проблема:{' '}
                  {issueCategories.find((c) => c.value === state.issueCategory)?.label}
                </p>
                {state.notes && (
                  <p className="text-xs sm:text-sm text-orange-700 mt-1">{state.notes}</p>
                )}
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-3">
              <p className="text-xs sm:text-sm font-semibold text-green-900">✍️ Подписал</p>
              <p className="text-base sm:text-lg font-bold text-green-700">
                {state.recipientName || '(Не подписано)'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
              <button
                onClick={() => setCurrentStep('notes')}
                className="flex-1 py-2 sm:py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 text-sm sm:text-base"
              >
                ← Назад
              </button>
              <button
                onClick={submitChecklist}
                disabled={state.isSubmitting}
                className="flex-1 py-2 sm:py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400 text-sm sm:text-base"
              >
                {state.isSubmitting ? '⏳ Отправка...' : '✓ Завершить доставку'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {state.error && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-4 z-50">
          <p className="font-semibold">{state.error}</p>
        </div>
      )}
    </div>
  );
}
