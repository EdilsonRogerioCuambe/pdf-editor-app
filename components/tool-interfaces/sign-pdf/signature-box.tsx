import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SignatureBox as SignatureBoxType } from './types';

interface SignatureBoxProps {
  box: SignatureBoxType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<SignatureBoxType>) => void;
  onDelete: (id: string) => void;
  zoom: number;
}

export function SignatureBox({ box, isSelected, onSelect, onUpdate, onDelete, zoom }: SignatureBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent, handle: string | null = null) => {
    e.stopPropagation();
    onSelect(box.id);

    // Only left click
    if (e.button !== 0) return;

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
      setResizeStart({
        width: box.width,
        height: box.height,
        x: e.clientX,
        y: e.clientY
      });
    } else {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - box.x * zoom,
        y: e.clientY - box.y * zoom
      });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Calculate new position relative to the page container
        // e.clientX is global, so we need the delta or relative calc.
        // But here we use delta from box offset

        const newX = (e.clientX - dragStart.x) / zoom;
        const newY = (e.clientY - dragStart.y) / zoom;

        onUpdate(box.id, { x: newX, y: newY });

      } else if (isResizing && resizeHandle) {
        const deltaX = (e.clientX - resizeStart.x) / zoom;
        const deltaY = (e.clientY - resizeStart.y) / zoom;

        let newWidth = resizeStart.width;
        let newHeight = resizeStart.height;
        let newX = box.x;
        let newY = box.y;

        // For signature, we MUST maintain aspect ratio generally, or allow free if user wants?
        // Let's implement free resize but with shift key logic later?
        // For now, simpler direct resize.
        // Aspect Ratio = Width / Height
        const aspectRatio = resizeStart.width / resizeStart.height;

        if (resizeHandle.includes('right')) {
           newWidth = Math.max(20, resizeStart.width + deltaX);
        }
        if (resizeHandle.includes('left')) {
           const potentialWidth = resizeStart.width - deltaX;
           if (potentialWidth > 20) {
               newWidth = potentialWidth;
               newX = box.x + deltaX; // Only move x if width changed
           }
        }

        if (resizeHandle.includes('bottom')) {
            newHeight = Math.max(10, resizeStart.height + deltaY);
        }
        if (resizeHandle.includes('top')) {
            const potentialHeight = resizeStart.height - deltaY;
            if (potentialHeight > 10) {
                newHeight = potentialHeight;
                newY = box.y + deltaY;
            }
        }

        // Maintain Aspect Ratio if box.maintainAspectRatio is true (default)
        if (box.maintainAspectRatio) {
            // If dragging corner, sync dimensions
            const isCorner = ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(resizeHandle);

            if (isCorner) {
                 // Determine primary axis based on movement magnitude
                 if (Math.abs(deltaX) > Math.abs(deltaY)) {
                     // Width based
                     newHeight = newWidth / aspectRatio;
                     // Adjust Y if top handle
                     if (resizeHandle.includes('top')) {
                         newY = (box.y + box.height) - newHeight;
                     }
                 } else {
                     // Height based
                     newWidth = newHeight * aspectRatio;
                     // Adjust X if left handle
                     if (resizeHandle.includes('left')) {
                        newX = (box.x + box.width) - newWidth;
                     }
                 }
            }
        }

        onUpdate(box.id, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (isDragging || isResizing) {
    //   e.preventDefault(); // Stop selection of text etc
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, resizeHandle, box.id, zoom, onUpdate, box.maintainAspectRatio]);

  const style: React.CSSProperties = {
     position: 'absolute',
     left: box.x * zoom,
     top: box.y * zoom,
     width: box.width * zoom,
     height: box.height * zoom,
     transform: `rotate(${box.rotation}deg)`,
     zIndex: box.zIndex,
     cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
        className={`group absolute select-none ${isSelected ? 'ring-1 ring-blue-500 bg-blue-50/10' : 'hover:ring-1 hover:ring-gray-300'}`}
        style={style}
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
    >
       <img
          src={box.signatureData}
          className="w-full h-full object-contain pointer-events-none select-none"
          alt="Signature"
          draggable={false}
       />

       {isSelected && (
           <>
              {/* Resize Handles */}
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((h) => (
                  <div
                    key={h}
                    className="absolute w-3 h-3 bg-white border border-blue-500 rounded-full z-20"
                    style={{
                        top: h.includes('top') ? -4 : undefined,
                        bottom: h.includes('bottom') ? -4 : undefined,
                        left: h.includes('left') ? -4 : undefined,
                        right: h.includes('right') ? -4 : undefined,
                        cursor: `${h.split('-').join('')}-resize`
                    }}
                    onMouseDown={(e) => handleMouseDown(e, h)}
                  />
              ))}

              {/* Actions Bar */}
              <div className="absolute -top-10 right-0 flex gap-1 bg-white shadow-md rounded p-1 z-30">
                 <button
                   onClick={(e) => { e.stopPropagation(); onDelete(box.id); }}
                   className="p-1 hover:bg-gray-100 rounded text-red-500"
                   title="Delete"
                 >
                    <X size={16} />
                 </button>
              </div>
           </>
       )}
    </div>
  );
}
