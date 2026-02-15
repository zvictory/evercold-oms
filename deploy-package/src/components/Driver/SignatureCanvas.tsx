'use client';

import { useRef, useEffect, useState } from 'react';
import { useI18n } from '@/locales/client';

interface SignatureCanvasProps {
  onSignatureSaved?: (signatureUrl: string) => void;
  onError?: (error: string) => void;
  recipientName?: string;
  onRecipientNameChange?: (name: string) => void;
}

export function SignatureCanvas({
  onSignatureSaved,
  onError,
  recipientName = '',
  onRecipientNameChange,
}: SignatureCanvasProps) {
  const t = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [name, setName] = useState(recipientName);

  /**
   * Initialize canvas
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Set drawing context
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  /**
   * Get mouse/touch position relative to canvas
   */
  const getPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const isTouch = 'touches' in e;

    if (isTouch) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  /**
   * Start drawing
   */
  const handleMouseDown = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  /**
   * Draw
   */
  const handleMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const pos = getPosition(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsEmpty(false);

    e.preventDefault();
  };

  /**
   * Stop drawing
   */
  const handleMouseUp = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  /**
   * Clear canvas
   */
  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      setIsEmpty(true);
    }
  };

  /**
   * Save signature as data URL
   */
  const saveSignature = () => {
    if (isEmpty) {
      onError?.(t('Driver.signature.errorEmpty'));
      return;
    }

    if (!name.trim()) {
      onError?.(t('Driver.signature.errorNoName'));
      return;
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSignatureSaved?.(dataUrl);
    }
  };

  /**
   * Handle name change
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    onRecipientNameChange?.(e.target.value);
  };

  return (
    <div className="space-y-4">
      {/* Recipient Name */}
      <div>
        <label className="block text-sm font-semibold mb-2">{t('Driver.signature.recipientName')} *</label>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder={t('Driver.signature.recipientNamePlaceholder')}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-600"
        />
      </div>

      {/* Signature Canvas */}
      <div>
        <label className="block text-sm font-semibold mb-2">{t('Driver.signature.signatureLabel')} *</label>
        <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            className="w-full cursor-crosshair touch-none"
            style={{ display: 'block', minHeight: '200px' }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">
          {t('Driver.signature.instructions')}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={clearSignature}
          className="flex-1 py-2 bg-slate-600 text-white rounded-lg font-bold hover:bg-slate-700"
        >
          🔄 {t('Driver.signature.clear')}
        </button>
        <button
          onClick={saveSignature}
          disabled={isEmpty || !name.trim()}
          className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:bg-slate-400"
        >
          ✓ {t('Driver.signature.save')}
        </button>
      </div>
    </div>
  );
}
