import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Palette, Type, Underline } from "lucide-react";
import { TextBox } from "./types";

interface AddTextToolbarProps {
  selectedBox?: TextBox | null;
  onUpdate: (updates: Partial<TextBox>) => void;
  onDownload: () => void;
  isProcessing: boolean;
}

export function AddTextToolbar({ selectedBox, onUpdate, onDownload, isProcessing }: AddTextToolbarProps) {
  if (!selectedBox) {
    return (
      <div className="w-full h-14 bg-white border-b flex items-center px-4 justify-between">
         <div className="text-sm text-gray-500">Select a text box to edit properties</div>

      </div>
    )
  }

  const fonts = [
    "Helvetica",
    "Times Roman",
    "Courier",
    "Arial", // Mapped to Helvetica
    "Verdana", // Mapped to Helvetica
    "Times New Roman", // Mapped to Times
    "Georgia", // Mapped to Times
    "Courier New", // Mapped to Courier
    "Consolas" // Mapped to Courier
  ];
  const fontSizes = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 48, 64];

  return (
    <div className="w-full h-14 bg-white border-b flex items-center px-4 gap-4 justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {/* Font Family */}
        <Select
            value={selectedBox.fontFamily}
            onValueChange={(val) => onUpdate({ fontFamily: val })}
        >
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
             {fonts.map(f => (
                 <SelectItem key={f} value={f}>{f}</SelectItem>
             ))}
          </SelectContent>
        </Select>

        {/* Font Size */}
        <Select
            value={selectedBox.fontSize.toString()}
            onValueChange={(val) => onUpdate({ fontSize: parseInt(val) })}
        >
          <SelectTrigger className="w-[70px] h-9">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
             {fontSizes.map(s => (
                 <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
             ))}
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        {/* Formatting */}
        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <Button
                variant={selectedBox.fontWeight === 'bold' ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdate({ fontWeight: selectedBox.fontWeight === 'bold' ? 'normal' : 'bold' })}
            >
                <Bold size={16} />
            </Button>
            <Button
                variant={selectedBox.fontStyle === 'italic' ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdate({ fontStyle: selectedBox.fontStyle === 'italic' ? 'normal' : 'italic' })}
            >
                <Italic size={16} />
            </Button>
            <Button
                variant={selectedBox.textDecoration === 'underline' ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdate({ textDecoration: selectedBox.textDecoration === 'underline' ? 'none' : 'underline' })}
            >
                <Underline size={16} />
            </Button>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        {/* Alignment */}
        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <Button
                variant={selectedBox.textAlign === 'left' ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdate({ textAlign: 'left' })}
            >
                <AlignLeft size={16} />
            </Button>
            <Button
                variant={selectedBox.textAlign === 'center' ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdate({ textAlign: 'center' })}
            >
                <AlignCenter size={16} />
            </Button>
            <Button
                variant={selectedBox.textAlign === 'right' ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onUpdate({ textAlign: 'right' })}
            >
                <AlignRight size={16} />
            </Button>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-2" />

        {/* Colors */}
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded px-2 py-1 bg-white">
                <Type size={14} className="text-gray-500" />
                <input
                    type="color"
                    value={selectedBox.color}
                    onChange={(e) => onUpdate({ color: e.target.value })}
                    className="w-6 h-6 border-none cursor-pointer p-0"
                />
            </div>

            <div className="flex items-center gap-1 border rounded px-2 py-1 bg-white">
                <Palette size={14} className="text-gray-500" />
                <div className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        checked={selectedBox.hasBackground}
                        onChange={(e) => onUpdate({ hasBackground: e.target.checked })}
                    />
                    {selectedBox.hasBackground && (
                        <input
                            type="color"
                            value={selectedBox.backgroundColor}
                            onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                            className="w-6 h-6 border-none cursor-pointer p-0"
                        />
                    )}
                </div>
            </div>
        </div>

      </div>

      <div className="flex-1" />


    </div>
  )
}
