import { Copy, Trash2 } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { TextBox as TextBoxType } from './types';

interface TextBoxProps {
  box: TextBoxType;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<TextBoxType>) => void;
  onDuplicate: (box: TextBoxType) => void;
  onDelete: (id: string) => void;
  zoom: number;
}

export function TextBox({ box, isSelected, onSelect, onUpdate, onDuplicate, onDelete, zoom }: TextBoxProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialDims, setInitialDims] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const textRef = useRef<HTMLTextAreaElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Auto-focus when editing starts
  useEffect(() => {
    if (isEditing && textRef.current) {
        textRef.current.focus();
        // Set cursor to end
        textRef.current.setSelectionRange(textRef.current.value.length, textRef.current.value.length);
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent interfering if clicking buttons
    if ((e.target as HTMLElement).closest('button')) {
        return;
    }

    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        setResizeDirection(target.getAttribute('data-direction'));
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialDims({ x: box.x, y: box.y, w: box.width, h: 0 }); // h not currently used as fixed height
        onSelect(box.id);
        return;
    }

    e.stopPropagation();
    onSelect(box.id);

    if (!isEditing) {
        setIsDragging(true);
        setDragStart({
            x: e.clientX,
            y: e.clientY
        });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            const dx = (e.clientX - dragStart.x) / zoom;
            const dy = (e.clientY - dragStart.y) / zoom;

            onUpdate(box.id, {
                x: box.x + dx,
                y: box.y + dy
            });

            setDragStart({
                x: e.clientX,
                y: e.clientY
            });
        }

        if (isResizing && resizeDirection) {
            const dx = (e.clientX - dragStart.x) / zoom;
            // const dy = (e.clientY - dragStart.y) / zoom; // unused for now if height is auto

            if (resizeDirection.includes('right')) {
                 const newWidth = Math.max(50, initialDims.w + dx);
                 onUpdate(box.id, { width: newWidth });
            }
            if (resizeDirection.includes('left')) {
                 const newWidth = Math.max(50, initialDims.w - dx);
                 // When resizing left, we also move X
                 onUpdate(box.id, {
                     x: initialDims.x + dx,
                     width: newWidth
                 });
            }
            // Vertical resize logic could be added here if we allowed fixed height
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeDirection(null);
    };

    if (isDragging || isResizing) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, resizeDirection, dragStart, zoom, box.id, box.x, box.y, initialDims, onUpdate]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate(box.id, { content: e.target.value });

    // Auto-resize height logic could go here if we weren't using absolute basic
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // Allow escape to blur
      if (e.key === 'Escape') {
          setIsEditing(false);
      }
  }

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${box.x * zoom}px`,
    top: `${box.y * zoom}px`,
    width: `${box.width * zoom}px`,
    // If we're editing, we might want to let the height grow, but for now fixed/auto
    minHeight: `${box.fontSize * zoom * 1.5}px`,

    fontSize: `${box.fontSize * zoom}px`,
    fontFamily: box.fontFamily,
    fontWeight: box.fontWeight,
    fontStyle: box.fontStyle,
    textDecoration: box.textDecoration,
    color: box.color,
    opacity: box.opacity,
    textAlign: box.textAlign,
    lineHeight: box.lineHeight,
    letterSpacing: `${box.letterSpacing}px`,
    transform: `rotate(${box.rotation}deg)`,
    zIndex: box.zIndex,
    cursor: isDragging ? 'grabbing' : isEditing ? 'text' : 'grab',
    border: isSelected ? '2px solid #3b82f6' : '1px solid transparent',
    backgroundColor: box.hasBackground ? box.backgroundColor : 'transparent',
    padding: `${(box.hasBackground ? box.backgroundPadding : 0) * zoom}px`,
    borderRadius: `${box.backgroundBorderRadius * zoom}px`,
    boxShadow: box.hasShadow
      ? `${box.shadowX}px ${box.shadowY}px ${box.shadowBlur}px ${box.shadowColor}`
      : 'none',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    userSelect: isEditing ? 'text' : 'none'
  };

  return (
    <div
      ref={boxRef}
      className={`text-box group ${isSelected ? 'selected' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <textarea
          ref={textRef}
          value={box.content}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full bg-transparent border-none outline-none resize-none overflow-hidden"
          style={{
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            fontStyle: 'inherit',
            color: 'inherit',
            lineHeight: 'inherit',
            textAlign: 'inherit',
            letterSpacing: 'inherit',
            textDecoration: 'inherit',
          }}
        />
      ) : (
        <div className="w-full h-full pointer-events-none">
            {box.content}
        </div>
      )}

      {isSelected && !isEditing && (
        <>
          {/* Action buttons - displaying above the box */}
          <div className="absolute -top-10 right-0 flex gap-1 bg-white p-1 rounded shadow-md border z-50">
             <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(box);
                }}
                className="p-1 hover:bg-gray-100 rounded text-gray-700"
                title="Duplicate"
            >
              <Copy size={16} />
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(box.id);
                }}
                className="p-1 hover:bg-red-50 rounded text-red-600"
                title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Resize handles - simplified for now */}
          <div data-direction="top-left" className="absolute -left-1 -top-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-nw-resize resize-handle" />
          <div data-direction="top-right" className="absolute -right-1 -top-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-ne-resize resize-handle" />
          <div data-direction="bottom-left" className="absolute -left-1 -bottom-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-sw-resize resize-handle" />
          <div data-direction="bottom-right" className="absolute -right-1 -bottom-1 w-2 h-2 bg-blue-500 border border-white rounded-full cursor-se-resize resize-handle" />
        </>
      )}
    </div>
  );
}
