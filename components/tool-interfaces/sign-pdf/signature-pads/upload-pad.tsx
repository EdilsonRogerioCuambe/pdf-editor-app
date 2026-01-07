import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Upload, X } from "lucide-react";
import { useTranslations } from 'next-intl';
import React, { useEffect, useRef, useState } from 'react';

interface SignatureUploadPadProps {
  onSave: (data: string) => void;
  onCancel: () => void;
}

export function SignatureUploadPad({ onSave, onCancel }: SignatureUploadPadProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [threshold, setThreshold] = useState(20); // Sensitivity for "white" detection
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => setImage(img);
        img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
        loadFile(e.dataTransfer.files[0]);
    }
  };

  useEffect(() => {
    if (image) processImage();
  }, [image, removeBg, threshold]);

  const processImage = () => {
     const canvas = canvasRef.current;
     if (!canvas || !image) return;

     // Resize for preview (keep aspect ratio but limit size)
     const maxWidth = 500;
     const maxHeight = 300;
     let w = image.width;
     let h = image.height;

     if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w *= ratio;
        h *= ratio;
     }

     canvas.width = w;
     canvas.height = h;
     const ctx = canvas.getContext('2d');
     if (!ctx) return;

     ctx.drawImage(image, 0, 0, w, h);

     if (removeBg) {
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const thresh = 255 - (threshold * 3); // Approx threshold value

        for (let i = 0; i < data.length; i += 4) {
             const r = data[i];
             const g = data[i + 1];
             const b = data[i + 2];

             // Simple brightness check: if close to white, make transparent
             if (r > thresh && g > thresh && b > thresh) {
                 data[i + 3] = 0; // Alpha 0
             }
        }
        ctx.putImageData(imageData, 0, 0);
     }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        onSave(canvas.toDataURL('image/png'));
    }
  };


  const t = useTranslations('sign.upload');

  if (!image) {
      return (
          <div
            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg h-[300px] bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
          >
             <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
             <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                 <Upload className="w-8 h-8 text-primary" />
             </div>
             <p className="font-medium text-lg">{t('clickToUpload')}</p>
             <p className="text-sm text-gray-500">{t('dragDrop')}</p>
          </div>
      );
  }

  return (
    <div className="flex flex-col gap-4 h-full">
       <div className="flex justify-between items-center pb-2 border-b">
          <p className="text-sm font-medium text-gray-700">{t('preview')}</p>
          <Button variant="ghost" size="sm" onClick={() => setImage(null)}>
             <X className="w-4 h-4 mr-1" /> {t('useDifferent')}
          </Button>
       </div>

       <div className="flex-1 flex items-center justify-center bg-checkered rounded-lg border overflow-hidden p-4">
          <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
       </div>

       <div className="flex flex-col gap-4 py-2">
          <div className="flex items-center gap-2">
             <input type="checkbox" id="rm-bg" checked={removeBg} onChange={e => setRemoveBg(e.target.checked)} className="rounded border-gray-300" />
             <label htmlFor="rm-bg" className="text-sm font-medium">{t('removeBackground')}</label>
          </div>

          {removeBg && (
              <div className="flex items-center gap-4">
                 <span className="text-xs w-20">{t('threshold')}</span>
                 <Slider value={[threshold]} max={50} min={5} step={1} onValueChange={(val) => setThreshold(val[0])} className="flex-1" />
              </div>
          )}
       </div>

       <Button size="lg" onClick={handleSave} className="mt-2">{t('useSignature')}</Button>
    </div>
  );
}
