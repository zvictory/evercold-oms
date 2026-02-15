'use client';

import { useRef, useState, useCallback } from 'react';
import { useI18n } from '@/locales/client';
import { PhotoUploadService, UploadedPhoto } from '@/lib/photoUploadService';

interface PhotoCaptureProps {
  checklistId: string;
  onPhotoAdded?: (photo: UploadedPhoto) => void;
  onError?: (error: string) => void;
}

export function PhotoCapture({ checklistId, onPhotoAdded, onError }: PhotoCaptureProps) {
  const t = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<'proof_of_delivery' | 'damage' | 'location' | 'signature'>(
    'proof_of_delivery'
  );

  const photoTypes = [
    { value: 'proof_of_delivery', label: t('Driver.delivery.wizard.photoCapture.photoTypes.proofOfDelivery') },
    { value: 'damage', label: t('Driver.delivery.wizard.photoCapture.photoTypes.damage') },
    { value: 'location', label: t('Driver.delivery.wizard.photoCapture.photoTypes.location') },
    { value: 'signature', label: t('Driver.delivery.wizard.photoCapture.photoTypes.signature') },
  ];

  /**
   * Start camera
   */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      const message = t('Driver.delivery.wizard.photoCapture.cameraError');
      console.error(message, error);
      onError?.(message);
    }
  }, [onError]);

  /**
   * Stop camera
   */
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCameraActive(false);
  }, []);

  /**
   * Capture photo from video stream
   */
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Set canvas dimensions to match video
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(videoRef.current, 0, 0);

      // Convert canvas to blob
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;

        try {
          setIsUploading(true);

          // Create File from blob
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

          // Upload photo
          const uploadedPhoto = await PhotoUploadService.uploadPhoto({
            file,
            photoType: selectedType,
            checklistId,
          });

          setPhotos((prev) => [...prev, uploadedPhoto]);
          onPhotoAdded?.(uploadedPhoto);
        } catch (error) {
          const message = `${t('Driver.delivery.wizard.photoCapture.uploadError')}: ${error instanceof Error ? error.message : ''}`;
          console.error(message, error);
          onError?.(message);
        } finally {
          setIsUploading(false);
        }
      }, 'image/jpeg');
    } catch (error) {
      const message = t('Driver.delivery.wizard.photoCapture.captureError');
      console.error(message, error);
      onError?.(message);
    }
  }, [selectedType, checklistId, onPhotoAdded, onError]);

  /**
   * Upload photo from file input
   */
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        setIsUploading(true);
        const uploadedPhoto = await PhotoUploadService.uploadPhoto({
          file,
          photoType: selectedType,
          checklistId,
        });

        setPhotos((prev) => [...prev, uploadedPhoto]);
        onPhotoAdded?.(uploadedPhoto);
      } catch (error) {
        const message = `Failed to upload photo: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(message, error);
        onError?.(message);
      } finally {
        setIsUploading(false);
        e.target.value = ''; // Reset input
      }
    },
    [selectedType, checklistId, onPhotoAdded, onError]
  );

  /**
   * Delete photo
   */
  const deletePhoto = useCallback(
    async (photoId: string) => {
      try {
        await PhotoUploadService.deletePhoto(photoId);
        setPhotos((prev) => prev.filter((p) => p.id !== photoId));
      } catch (error) {
        const message = t('Driver.delivery.wizard.photoCapture.deleteError');
        console.error(message, error);
        onError?.(message);
      }
    },
    [onError]
  );

  return (
    <div className="space-y-4">
      {/* Type Selector */}
      <div>
        <label className="block text-sm font-semibold mb-2">{t('Driver.delivery.wizard.photoCapture.photoTypeLabel')}</label>
        <div className="flex flex-wrap gap-2">
          {photoTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value as any)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                selectedType === type.value
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Camera View */}
      {isCameraActive ? (
        <div className="space-y-3">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video bg-black rounded-lg"
          />
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2">
            <button
              onClick={capturePhoto}
              disabled={isUploading}
              className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:bg-slate-400"
            >
              {isUploading ? t('Driver.delivery.wizard.photoCapture.uploading') : t('Driver.delivery.wizard.photoCapture.takePhotoButton')}
            </button>
            <button
              onClick={stopCamera}
              className="flex-1 py-3 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700"
            >
              {t('Driver.delivery.wizard.photoCapture.closeCamera')}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <button
            onClick={startCamera}
            className="w-full py-3 bg-sky-600 text-white rounded-lg font-bold hover:bg-sky-700"
          >
            {t('Driver.delivery.wizard.photoCapture.openCamera')}
          </button>

          <label className="block">
            <div className="w-full py-3 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700 text-center cursor-pointer">
              {t('Driver.delivery.wizard.photoCapture.chooseFromGallery')}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* Photos Grid */}
      {photos.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">
            {t('Driver.delivery.wizard.photoCapture.photosCount', { count: String(photos.length) })}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.url}
                  alt={photo.photoType}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded font-bold"
                  >
                    {t('Driver.delivery.wizard.photoCapture.deleteButton')}
                  </button>
                </div>
                {photo.photoType && (
                  <p className="text-xs text-slate-600 mt-1 truncate">{photo.photoType}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
