import {
    Archive,
    Droplets,
    FileImage,
    GripVertical,
    Hash,
    ImageIcon,
    Lock,
    Merge,
    Pencil,
    PenTool,
    RotateCw,
    Scissors,
    Trash2,
    Unlock,
    type LucideIcon
} from "lucide-react"

export type ToolId =
  | "merge"
  | "split"
  | "compress"
  | "rotate"
  | "delete"
  | "reorder"
  | "pdf-to-image"
  | "image-to-pdf"
  | "watermark"
  | "page-numbers"
  | "sign"
  | "annotate"
  | "protect"
  | "unlock"

export interface PDFTool {
  id: ToolId
  name: string
  description: string
  icon: LucideIcon
  category: "organize" | "convert" | "edit" | "security"
}

export const pdfTools: PDFTool[] = [
  {
    id: "merge",
    name: "Merge PDFs",
    description: "Combine multiple PDF files into one",
    icon: Merge,
    category: "organize",
  },
  {
    id: "split",
    name: "Split PDF",
    description: "Extract specific pages from your PDF",
    icon: Scissors,
    category: "organize",
  },
  {
    id: "compress",
    name: "Compress PDF",
    description: "Reduce PDF file size",
    icon: Archive,
    category: "organize",
  },
  {
    id: "rotate",
    name: "Rotate Pages",
    description: "Rotate pages 90°, 180°, or 270°",
    icon: RotateCw,
    category: "organize",
  },
  {
    id: "delete",
    name: "Delete Pages",
    description: "Remove unwanted pages",
    icon: Trash2,
    category: "organize",
  },
  {
    id: "reorder",
    name: "Reorder Pages",
    description: "Drag and drop to rearrange",
    icon: GripVertical,
    category: "organize",
  },
  {
    id: "pdf-to-image",
    name: "PDF to Image",
    description: "Convert PDF to JPG or PNG",
    icon: ImageIcon,
    category: "convert",
  },
  {
    id: "image-to-pdf",
    name: "Image to PDF",
    description: "Convert images to PDF",
    icon: FileImage,
    category: "convert",
  },
  {
    id: "watermark",
    name: "Add Watermark",
    description: "Insert text or image watermark",
    icon: Droplets,
    category: "edit",
  },
  {
    id: "page-numbers",
    name: "Add Page Numbers",
    description: "Automatic page numbering",
    icon: Hash,
    category: "edit",
  },
  {
    id: "sign",
    name: "Sign PDF",
    description: "Add your signature",
    icon: PenTool,
    category: "edit",
  },
  {
    id: "annotate",
    name: "Annotate PDF",
    description: "Add highlights, drawings, notes & more",
    icon: Pencil,
    category: "edit",
  },
  {
    id: "protect",
    name: "Protect PDF",
    description: "Add password protection",
    icon: Lock,
    category: "security",
  },
  {
    id: "unlock",
    name: "Unlock PDF",
    description: "Remove password protection",
    icon: Unlock,
    category: "security",
  },
]
