import { Button } from "@/components/ui/button";
import { RotateCcw, Trash2 } from "lucide-react";
import { useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState } from 'react';

interface SignatureDrawPadProps {
  onSave: (data: string) => void;
  onCancel: () => void;
}

export function SignatureDrawPad({ onSave, onCancel }: SignatureDrawPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Array<{ points: {x: number, y: number}[], color: string, size: number }>>([]);
  const [currentStroke, setCurrentStroke] = useState<{x: number, y: number}[]>([]);
  const [penColor, setPenColor] = useState('#000000');
  const [penSize, setPenSize] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set high DPI
    const dpr = window.devicePixelRatio || 1;
    // We assume the parent container sets the width/height constraint
    // But for canvas actual drawing buffer we need explicit sizing
    const rect = canvas.getBoundingClientRect();

    // Only resize if dimensions differ to avoid clear on every render
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
       canvas.width = rect.width * dpr;
       canvas.height = rect.height * dpr;
       const ctx = canvas.getContext('2d');
       if (ctx) ctx.scale(dpr, dpr);
    }

    redrawCanvas();
  }, [strokes, currentStroke]); // Redraw when strokes change

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    // Clear using logic size
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.stroke();
    });

    // Draw current stroke
    if (currentStroke.length > 1) {
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penSize;
        ctx.beginPath();
        ctx.moveTo(currentStroke[0].x, currentStroke[0].y);
        for (let i = 1; i < currentStroke.length; i++) {
            ctx.lineTo(currentStroke[i].x, currentStroke[i].y);
        }
        ctx.stroke();
    }
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX, clientY;

    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }

    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
        // e.preventDefault(); // Prevent scrolling on touch
    }
    setIsDrawing(true);
    const coords = getCoordinates(e);
    setCurrentStroke([coords]);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if ('touches' in e) {
       // e.preventDefault();
    }

    const coords = getCoordinates(e);
    /*
       For performance in React state updates, spreading large arrays can be slow.
       However, for a signature pad it's usually acceptable.
       Optimized approach would be refs for points and only state for completed strokes.
       But let's stick to functional implementation for now.
    */
    setCurrentStroke(prev => [...prev, coords]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 0) {
      setStrokes(prev => [...prev, {
        points: currentStroke,
        color: penColor,
        size: penSize
      }]);
      setCurrentStroke([]);
    }
    setIsDrawing(false);
  };

  const undo = () => {
    if (strokes.length > 0) {
      setStrokes(prev => prev.slice(0, -1));
    }
  };

  const clear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        if (ctx) ctx.clearRect(0, 0, canvas.width/dpr, canvas.height/dpr);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Auto-crop (simplified logic or full logic provided)
    // For robust implementation, let's use the provided logic
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width;  // physical pixels
    const height = canvas.height;

    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = imageData.data;

    let minX = width, minY = height, maxX = 0, maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = pixels[(y * width + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // If empty or white canvas
    if (maxX < minX) {
        // Just return full or empty
        return;
    }

    // Padding
    const padding = 10 * dpr;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(width, maxX + padding);
    maxY = Math.min(height, maxY + padding);

    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = cropWidth;
    tempCanvas.height = cropHeight;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
        tempCtx.drawImage(canvas, minX, minY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        onSave(tempCanvas.toDataURL('image/png'));
    }
  };

  const t = useTranslations('sign.draw');

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex-1 border rounded-lg bg-white relative overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair touch-none block"
          style={{ width: '100%', height: '300px' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {strokes.length === 0 && !isDrawing && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-gray-300">
                {t('signHere')}
             </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 items-center justify-between border-t pt-4">
        <div className="flex gap-2 items-center">
            {/* Color Pickers */}
            <button
                className={`w-6 h-6 rounded-full bg-black border-2 ${penColor === '#000000' ? 'border-primary' : 'border-transparent'}`}
                onClick={() => setPenColor('#000000')}
            />
            <button
                className={`w-6 h-6 rounded-full bg-blue-600 border-2 ${penColor === '#0000FF' ? 'border-primary' : 'border-transparent'}`}
                onClick={() => setPenColor('#0000FF')}
            />
            <button
                className={`w-6 h-6 rounded-full bg-red-600 border-2 ${penColor === '#FF0000' ? 'border-primary' : 'border-transparent'}`}
                onClick={() => setPenColor('#FF0000')}
            />

            <div className="w-px h-6 bg-gray-200 mx-2" />

            {/* Size Slider */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{t('size')}</span>
                <input
                    type="range"
                    min="1" max="10"
                    value={penSize}
                    onChange={(e) => setPenSize(parseInt(e.target.value))}
                    className="w-20"
                />
            </div>
        </div>

        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={strokes.length === 0}>
                <RotateCcw className="w-4 h-4 mr-1" /> {t('undo')}
            </Button>
            <Button variant="destructive" size="sm" onClick={clear}>
                <Trash2 className="w-4 h-4 mr-1" /> {t('clear')}
            </Button>
            <Button onClick={saveSignature} disabled={strokes.length === 0}>
                {t('create')}
            </Button>
        </div>
      </div>
    </div>
  );
}
