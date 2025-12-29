"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors
} from "@dnd-kit/core"
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    ChevronsDown,
    ChevronsUp,
    Download,
    GripVertical,
    Loader2,
    RefreshCw,
    RotateCcw
} from "lucide-react"
import { useTranslations } from "next-intl"
import { PDFDocument } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"
import { useState } from "react"
import { toast } from "sonner"

// Set worker source
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

interface PageItem {
  id: string
  originalIndex: number
  imageUrl: string | null
  pageNumber: number // 1-based index from original
}

// -- Sortable Item Component --
function SortablePage({
  id,
  item,
  index,
  onMoveUp,
  onMoveDown,
  onMoveFirst,
  onMoveLast,
  total,
  t
}: {
  id: string
  item: PageItem
  index: number
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveFirst: () => void
  onMoveLast: () => void
  total: number
  t: any
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group flex flex-col gap-2 rounded-lg p-3 border bg-card transition-all duration-200",
        isDragging && "ring-2 ring-primary shadow-xl scale-105"
      )}
    >
      {/* Drag Handle Overlay */}
      <div
         {...attributes}
         {...listeners}
         className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
      />

      {/* Manual Controls (above drag layer in z-index) */}
       <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md shadow-sm p-0.5">
           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMoveUp() }} disabled={index === 0} title={t('moveBack')}>
               <ArrowUp className="h-3 w-3" />
           </Button>
           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMoveDown() }} disabled={index === total - 1} title={t('moveForward')}>
               <ArrowDown className="h-3 w-3" />
           </Button>
       </div>

       <div className="absolute top-2 left-2 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md shadow-sm p-0.5">
           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMoveFirst() }} disabled={index === 0} title={t('moveToStart')}>
               <ChevronsUp className="h-3 w-3" />
           </Button>
           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onMoveLast() }} disabled={index === total - 1} title={t('moveToEnd')}>
               <ChevronsDown className="h-3 w-3" />
           </Button>
       </div>

      {/* Visuals */}
      <div className="aspect-[3/4] relative flex items-center justify-center overflow-hidden bg-muted/20 rounded-md pointer-events-none select-none">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt={`Page ${item.pageNumber}`}
            className="object-contain max-w-full max-h-full shadow-sm"
          />
        ) : (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
        )}

        {/* Grip Icon */}
        <div className="absolute center bg-background/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-5 h-5 text-foreground/80" />
        </div>
      </div>

      <div className="flex flex-col gap-0.5 px-1 py-1 text-center pointer-events-none">
        <span className="text-sm font-medium">{t('page', {index: index + 1})}</span>
        {item.originalIndex !== index && (
           <Badge variant="outline" className="mx-auto text-[10px] h-4 px-1 py-0 w-fit text-muted-foreground">
               {t('was', {index: item.originalIndex + 1})}
           </Badge>
        )}
      </div>
    </div>
  )
}


export function ReorderInterface() {
  const t = useTranslations('reorder')
  const tCommon = useTranslations('common')
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [items, setItems] = useState<PageItem[]>([])
  const [loadingThumbnails, setLoadingThumbnails] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // Dnd Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleFileSelected = async (files: UploadedFile[]) => {
    if (files.length === 0) return
    const newFile = files[0]
    setFile(newFile)
    setLoadingThumbnails(true)

    try {
      const arrayBuffer = await newFile.file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      const pageCount = pdf.numPages
      const newItems: PageItem[] = []

      for (let i = 0; i < pageCount; i++) {
        // Render thumb
        try {
            const page = await pdf.getPage(i + 1)
            const viewport = page.getViewport({ scale: 0.4 }) // Smaller scale for reorder grid
            const canvas = document.createElement("canvas")
            const context = canvas.getContext("2d")
            canvas.width = viewport.width
            canvas.height = viewport.height
            await page.render({ canvasContext: context!, viewport }).promise

            newItems.push({
                id: `page-${i}`,
                originalIndex: i,
                pageNumber: i + 1,
                imageUrl: canvas.toDataURL("image/jpeg", 0.7),
            })

            // Batched updates
            if (i % 5 === 0 || i === pageCount - 1) {
                setItems([...newItems])
            }
        } catch(e) { console.error(e) }
      }
    } catch (err) {
      console.error("Error loading PDF", err)
      toast.error(tCommon('fileTooLarge') || "Failed to load PDF")
      setFile(null)
    } finally {
      setLoadingThumbnails(false)
    }
  }

  // -- Dnd Handlers
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  // -- Helper Actions
  const resetOrder = () => {
      const sorted = [...items].sort((a, b) => a.originalIndex - b.originalIndex)
      setItems(sorted)
      toast.success(t('resetSuccess'))
  }

  const reverseOrder = () => {
      setItems([...items].reverse())
      toast.success(t('reverseSuccess'))
  }

  const moveItem = (index: number, newIndex: number) => {
      setItems(prev => arrayMove(prev, index, newIndex))
  }

  const handleSave = async () => {
      if (!file || items.length === 0) return

      try {
          setIsProcessing(true)
          setProgress(0)

          const fileBytes = await file.file.arrayBuffer()
          const srcDoc = await PDFDocument.load(fileBytes)
          const newDoc = await PDFDocument.create()

          // Copy pages in the new order
          const indicesToCopy = items.map(item => item.originalIndex)
          const copiedPages = await newDoc.copyPages(srcDoc, indicesToCopy)

          copiedPages.forEach((page, idx) => {
               newDoc.addPage(page)
               setProgress(Math.round(((idx + 1) / items.length) * 80))
          })

          setProgress(90)
          const pdfBytes = await newDoc.save()

          const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `reordered-${file.name}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          setProgress(100)
          toast.success(t('saveSuccess'))

      } catch (err) {
          console.error("Save error", err)
          toast.error(t('saveError') || "Failed to save PDF")
      } finally {
          setIsProcessing(false)
      }
  }

  if (!file) {
      return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-2">
                 <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <ArrowUpDown className="h-8 w-8 text-primary" />
                 </div>
                 <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
                 <p className="text-muted-foreground">{t('description')}</p>
             </div>
             <FileDropZone
                onFilesSelected={handleFileSelected}
                accept=".pdf"
                multiple={false}
                maxFiles={1}
            />
        </div>
      )
  }

  const hasChanges = items.some((item, index) => item.originalIndex !== index)

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
           <div>
               <h3 className="font-semibold text-lg">{file.name}</h3>
               <div className="flex items-center gap-3 text-sm mt-1 text-muted-foreground">
                   <span>{t('pagesCount', {count: items.length})}</span>
                   {hasChanges && <Badge variant="secondary" className="text-xs">{t('orderModified')}</Badge>}
               </div>
           </div>

           <div className="flex flex-wrap items-center gap-2">
               <Button variant="outline" size="sm" onClick={resetOrder} disabled={!hasChanges}>
                   <RotateCcw className="w-3 h-3 mr-2" />
                   {t('reset')}
               </Button>
               <Button variant="outline" size="sm" onClick={reverseOrder}>
                   <RefreshCw className="w-3 h-3 mr-2" />
                   {t('reverse')}
               </Button>
               <Button onClick={handleSave} disabled={isProcessing}>
                   {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                   {t('save')}
               </Button>
           </div>
       </div>

       {isProcessing && <Progress value={progress} className="h-2" />}

       <div className="bg-muted/10 rounded-xl border p-4 flex-1 overflow-y-auto min-h-[500px]">
           {loadingThumbnails && items.length === 0 ? (
               <div className="flex justify-center py-20">
                   <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
               </div>
           ) : (
               <DndContext
                 sensors={sensors}
                 collisionDetection={closestCenter}
                 onDragEnd={handleDragEnd}
               >
                   <SortableContext items={items} strategy={rectSortingStrategy}>
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-10">
                           {items.map((item, index) => (
                               <SortablePage
                                   key={item.id}
                                   id={item.id}
                                   item={item}
                                   index={index}
                                   total={items.length}
                                   onMoveUp={() => moveItem(index, index - 1)}
                                   onMoveDown={() => moveItem(index, index + 1)}
                                   onMoveFirst={() => moveItem(index, 0)}
                                   onMoveLast={() => moveItem(index, items.length - 1)}
                                   t={t}
                               />
                           ))}
                       </div>
                   </SortableContext>
               </DndContext>
           )}
       </div>
    </div>
  )
}
