'use client';

import { useRef, useEffect, useState } from 'react';

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
      onError?.('Please draw a signature');
      return;
    }

    if (!name.trim()) {
      onError?.('Please enter recipient name');
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
        <label className="block text-sm font-semibold mb-2">Recipient Name *</label>
        <input
          type="text"
          value={name}
          onChange={handleNameChange}
          placeholder="Enter name of recipient"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
        />
      </div>

      {/* Signature Canvas */}
      <div>
        <label className="block text-sm font-semibold mb-2">Signature *</label>
        <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
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
        <p className="text-xs text-gray-500 mt-1">
          Sign with your finger or mouse. Make sure signature is visible.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={clearSignature}
          className="flex-1 py-2 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700"
        >
          🔄 Clear
        </button>
        <button
          onClick={saveSignature}
          disabled={isEmpty || !name.trim()}
          className="flex-1 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
        >
          ✓ Save Signature
        </button>
      </div>
    </div>
  );
}
