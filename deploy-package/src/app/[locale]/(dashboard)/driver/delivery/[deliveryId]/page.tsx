'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCurrentLocale, useI18n } from '@/locales/client';
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
  routeStop?: {
    id: string;
    routeId: string;
    status: string;
  };
}

interface Photo {
  url: string;
  photoType: string;
  caption?: string;
}

export default function DeliveryChecklistPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useCurrentLocale();
  const t = useI18n();
  const deliveryId = params.deliveryId as string;

  const issueCategories = [
    { value: 'customer_absent', label: t('Driver.delivery.checklist.issueCategories.customerAbsent') },
    { value: 'wrong_address', label: t('Driver.delivery.checklist.issueCategories.wrongAddress') },
    { value: 'damaged_goods', label: t('Driver.delivery.checklist.issueCategories.damagedGoods') },
    { value: 'access_denied', label: t('Driver.delivery.checklist.issueCategories.accessDenied') },
    { value: 'delivery_refused', label: t('Driver.delivery.checklist.issueCategories.deliveryRefused') },
    { value: 'other', label: t('Driver.delivery.checklist.issueCategories.other') },
  ];

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
  const [itemsVerificationComplete, setItemsVerificationComplete] = useState(true);

  // Load delivery data
  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const token = localStorage.getItem('driverToken');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/deliveries/${deliveryId}`, {
          headers
        });
        if (!response.ok) throw new Error('Failed to fetch delivery');

        const data = await response.json();

        // If delivery has a route stop and driver hasn't marked arrival yet, redirect to arrival page
        if (data.routeStop?.status === 'PENDING') {
          router.push(`/${locale}/driver/delivery/${deliveryId}/arrival`);
          return;
        }

        setDelivery(data);

        // Initialize verified items from order items
        // ✓ Auto-verify: assume all items delivered successfully by default
        const initialItems: VerifiedItem[] = data.order.orderItems.map((item: OrderItem) => ({
          orderItemId: item.id,
          productId: item.productId,
          productName: item.product?.name || `Product ${item.sapCode}`,
          orderedQuantity: item.quantity,
          deliveredQuantity: item.quantity,  // Auto-fill with ordered amount
          rejectedQuantity: 0,
          unit: item.product?.unit || item.unit,
          verified: true,                    // Auto-verified
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
      case 5:
        return true; // Review step - all validation done in previous steps
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

      const token = localStorage.getItem('driverToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/deliveries/${deliveryId}/checklist/complete`, {
        method: 'POST',
        credentials: 'include',
        headers,
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
      alert(t('Driver.delivery.success.title'));

      // Redirect back to routes page
      router.push(`/${locale}/driver`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete delivery';
      setError(message);
      alert(`${t('Driver.delivery.errors.title')}: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-200 border-t-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{t('Driver.delivery.loading')}</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h1 className="text-lg font-bold text-red-900 mb-2">{t('Driver.delivery.error')}</h1>
          <p className="text-red-700 mb-4">{error || t('Driver.delivery.notFound')}</p>
          <button
            onClick={() => router.push(`/${locale}/driver/routes`)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            {t('Driver.delivery.returnToRoutes')}
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
            className="mb-4 text-sky-600 hover:text-sky-700 font-medium text-sm"
          >
            {t('Driver.delivery.backButton')}
          </button>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-2 mb-2">
            <span>✅</span> {t('Driver.delivery.checklist.pageTitle')}
          </h1>

          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{t('Driver.delivery.checklist.orderLabel')}</span> {delivery.order.orderNumber}
            </p>
            <p className="text-sm text-slate-700">
              <span className="font-semibold">{t('Driver.delivery.checklist.customerLabel')}</span> {delivery.order.customer.name}
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
                    ? 'bg-sky-600'
                    : 'bg-emerald-600'
                  : 'bg-slate-200'
                  }`}
              />
            ))}
          </div>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            {t('Driver.delivery.wizard.step')} {currentStep} {t('Driver.delivery.wizard.of')} 5
          </p>
        </div>

        {/* Wizard Content */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 mb-6 sm:mb-8">
          {/* Step 1: Items Verification */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                {t('Driver.delivery.checklist.step1Title')}
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                {t('Driver.delivery.checklist.step1Description')}
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
                {t('Driver.delivery.checklist.step2Title')}
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                {t('Driver.delivery.checklist.step2Description')}
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
                    {t('Driver.delivery.checklist.photosUploaded', { count: String(photos.length) })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Digital Signature */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                {t('Driver.delivery.checklist.step3Title')}
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                {t('Driver.delivery.checklist.step3Description')}
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
                    {t('Driver.delivery.checklist.signatureReceived', { name: recipientName })}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Notes & Issues */}
          {currentStep === 4 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                {t('Driver.delivery.checklist.step4Title')}
              </h2>
              <p className="text-sm text-slate-600 mb-4">
                {t('Driver.delivery.checklist.step4Description')}
              </p>

              <div className="space-y-4">
                {/* Issue Category */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    {t('Driver.delivery.checklist.issueCategoryLabel')}
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
                    {t('Driver.delivery.checklist.notesLabel')}
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('Driver.delivery.checklist.notesPlaceholder')}
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-4">
                {t('Driver.delivery.checklist.step5Title')}
              </h2>

              <div className="space-y-4">
                {/* Summary */}
                <div className="bg-slate-50 p-4 rounded-lg space-y-3 border border-slate-200">
                  <div>
                    <p className="text-xs text-slate-600 font-medium">{t('Driver.delivery.checklist.summaryItems')}</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      {t('Driver.delivery.checklist.summaryVerified', { count: String(verifiedItems.filter((i) => i.verified).length), total: String(verifiedItems.length) })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 font-medium">{t('Driver.delivery.checklist.summaryPhotos')}</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      {t('Driver.delivery.checklist.summaryPhotosCount', { count: String(photos.length) })}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 font-medium">{t('Driver.delivery.checklist.summarySignature')}</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      {recipientName || t('Driver.delivery.checklist.summarySignatureNone')}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-600 font-medium">{t('Driver.delivery.checklist.summaryIssues')}</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900">
                      {issueCategory
                        ? issueCategories.find((c) => c.value === issueCategory)?.label || issueCategory
                        : t('Driver.delivery.checklist.summaryNoIssues')}
                    </p>
                  </div>
                </div>

                {/* Delivered Summary */}
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-xs text-green-700 font-medium mb-2">{t('Driver.delivery.checklist.summaryDelivered')}</p>
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
            {t('Driver.delivery.checklist.prevButton')}
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNextStep}
              disabled={!canProceedToNextStep()}
              className="flex-1 px-4 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
            >
              {t('Driver.delivery.checklist.nextButton')}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !canProceedToNextStep()}
              className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition"
            >
              {submitting ? t('Driver.delivery.checklist.submitting') : t('Driver.delivery.checklist.submitButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
