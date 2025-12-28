import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from 'react';

interface SignatureTypePadProps {
  onSave: (data: string, metadata?: any) => void;
  onCancel: () => void;
}

const FONTS = [
  { name: 'Great Vibes', url: 'https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap' },
  { name: 'Dancing Script', url: 'https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap' },
  { name: 'Pacifico', url: 'https://fonts.googleapis.com/css2?family=Pacifico&display=swap' },
  { name: 'Sacramento', url: 'https://fonts.googleapis.com/css2?family=Sacramento&display=swap' },
  { name: 'Allura', url: 'https://fonts.googleapis.com/css2?family=Allura&display=swap' },
];

export function SignatureTypePad({ onSave, onCancel }: SignatureTypePadProps) {
  const [text, setText] = useState('Your Name');
  const [font, setFont] = useState('Great Vibes');
  const [fontSize, setFontSize] = useState(60);
  const [color, setColor] = useState('#000000');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load fonts
  useEffect(() => {
    FONTS.forEach(fontObj => {
      const link = document.createElement('link');
      link.href = fontObj.url;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    });
  }, []);

  useEffect(() => {
    // Wait for fonts to load roughly, or just redraw on change
    const timer = setTimeout(renderPreview, 100);
    return () => clearTimeout(timer);
  }, [text, font, fontSize, color]);

  const renderPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Measure text
    ctx.font = `${fontSize}px "${font}", cursive`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.5; // Approximation

    // Set dimensions
    canvas.width = Math.max(textWidth + 40, 400); // Min width
    canvas.height = Math.max(textHeight + 40, 200);

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw
    ctx.font = `${fontSize}px "${font}", cursive`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  };

  const handleSave = () => {
     const canvas = canvasRef.current;
     if (!canvas) return;

     // Trim whitespace logic similar to DrawPad, or just save the bounding box of text
     // For typed text, we know the center, but canvas might differ.
     // Let's use auto-crop to be safe and clean.
     const ctx = canvas.getContext('2d');
     if (!ctx) return;

     const width = canvas.width;
     const height = canvas.height;
     const imageData = ctx.getImageData(0, 0, width, height);
     const pixels = imageData.data;

     let minX = width, minY = height, maxX = 0, maxY = 0;

     for (let y = 0; y < height; y++) {
         for (let x = 0; x < width; x++) {
             if (pixels[(y * width + x) * 4 + 3] > 0) {
                 if (x < minX) minX = x;
                 if (x > maxX) maxX = x;
                 if (y < minY) minY = y;
                 if (y > maxY) maxY = y;
             }
         }
     }

     if (maxX < minX) return; // Empty

     const padding = 10;
     minX = Math.max(0, minX - padding);
     minY = Math.max(0, minY - padding);
     maxX = Math.min(width, maxX + padding);
     maxY = Math.min(height, maxY + padding);

     const w = maxX - minX;
     const h = maxY - minY;

     const temp = document.createElement('canvas');
     temp.width = w;
     temp.height = h;
     const tCtx = temp.getContext('2d');
     if (tCtx) {
         tCtx.drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
         onSave(temp.toDataURL('image/png'), { text, font, color });
     }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full p-2">
      <div className="flex flex-col gap-2">
         <label className="text-sm font-medium">Text</label>
         <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-lg"
            placeholder="Type your signature..."
         />
      </div>

      <div className="flex-1 min-h-[200px] border rounded-lg bg-white flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="max-w-full max-h-full" />
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Font Family</label>
            <div className="flex flex-wrap gap-2">
                {FONTS.map(f => (
                    <button
                        key={f.name}
                        onClick={() => setFont(f.name)}
                        className={`px-3 py-1 border rounded text-lg ${font === f.name ? 'ring-2 ring-primary border-transparent' : 'hover:bg-gray-50'}`}
                        style={{ fontFamily: f.name }}
                    >
                        {f.name}
                    </button>
                ))}
            </div>
         </div>

         <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                    {['#000000', '#0000FF', '#FF0000', '#008000'].map(c => (
                        <button
                            key={c}
                            className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-primary ring-1 ring-offset-1 ring-primary' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setColor(c)}
                        />
                    ))}
                </div>
            </div>
         </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
         <Button onClick={handleSave} size="lg">Create Signature</Button>
      </div>
    </div>
  );
}
