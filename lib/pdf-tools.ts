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

// Type for translation function
type TranslationFunction = (key: string) => string

// Function to get tools with translations
export function getPDFTools(t: TranslationFunction): PDFTool[] {
  return [
    {
      id: "merge",
      name: t('merge.name'),
      description: t('merge.description'),
      icon: Merge,
      category: "organize",
    },
    {
      id: "split",
      name: t('split.name'),
      description: t('split.description'),
      icon: Scissors,
      category: "organize",
    },
    {
      id: "compress",
      name: t('compress.name'),
      description: t('compress.description'),
      icon: Archive,
      category: "organize",
    },
    {
      id: "rotate",
      name: t('rotate.name'),
      description: t('rotate.description'),
      icon: RotateCw,
      category: "organize",
    },
    {
      id: "delete",
      name: t('delete.name'),
      description: t('delete.description'),
      icon: Trash2,
      category: "organize",
    },
    {
      id: "reorder",
      name: t('reorder.name'),
      description: t('reorder.description'),
      icon: GripVertical,
      category: "organize",
    },
    {
      id: "pdf-to-image",
      name: t('pdf-to-image.name'),
      description: t('pdf-to-image.description'),
      icon: ImageIcon,
      category: "convert",
    },
    {
      id: "image-to-pdf",
      name: t('image-to-pdf.name'),
      description: t('image-to-pdf.description'),
      icon: FileImage,
      category: "convert",
    },
    {
      id: "watermark",
      name: t('watermark.name'),
      description: t('watermark.description'),
      icon: Droplets,
      category: "edit",
    },
    {
      id: "page-numbers",
      name: t('page-numbers.name'),
      description: t('page-numbers.description'),
      icon: Hash,
      category: "edit",
    },
    {
      id: "sign",
      name: t('sign.name'),
      description: t('sign.description'),
      icon: PenTool,
      category: "edit",
    },
    {
      id: "annotate",
      name: t('annotate.name'),
      description: t('annotate.description'),
      icon: Pencil,
      category: "edit",
    },
    {
      id: "protect",
      name: t('protect.name'),
      description: t('protect.description'),
      icon: Lock,
      category: "security",
    },
    {
      id: "unlock",
      name: t('unlock.name'),
      description: t('unlock.description'),
      icon: Unlock,
      category: "security",
    },
  ]
}

// Legacy export for backward compatibility (English only)
// This can be removed once all components are updated
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
