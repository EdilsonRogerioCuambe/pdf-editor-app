"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { PDFDocument } from 'pdf-lib'
import { useEffect, useRef, useState } from "react"
// Import pdfjs-dist dynamically to avoid SSR issues or handle worker correctly
import * as pdfjsLib from 'pdfjs-dist'

import { ArrowLeft, Download, PenTool, RotateCcw, RotateCw, ZoomIn, ZoomOut } from "lucide-react"
import { useTranslations } from "next-intl"
import { SignatureBox } from './sign-pdf/signature-box'
import { SignatureCreationModal } from './sign-pdf/signature-creation-modal'
import { SignatureBox as SignatureBoxType } from './sign-pdf/types'
import { addSignatureToPDF } from './sign-pdf/utils'

// Set worker source
if (typeof window !== 'undefined' && 'Worker' in window) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

export function SignInterface() {
  const t = useTranslations('sign')
  const tCommon = useTranslations('common')
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pages, setPages] = useState<Array<{ pageNum: number, width: number, height: number }>>([])

  const [signatureBoxes, setSignatureBoxes] = useState<SignatureBoxType[]>([])
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Canvas refs
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  const handleFileSelected = (files: UploadedFile[]) => {
    if (files.length > 0) {
      setFile(files[0])
      loadPDF(files[0])
    }
  }

  const loadPDF = async (file: UploadedFile) => {
    try {
        const arrayBuffer = await file.file.arrayBuffer()
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise
        setPdfDocument(pdf)

        const loadedPages = []
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const viewport = page.getViewport({ scale: 1.5 })
            loadedPages.push({
                pageNum: i,
                width: viewport.width,
                height: viewport.height,
            })
        }
        setPages(loadedPages)
    } catch (error) {
        console.error("Error loading PDF", error)
    }
  }

  // Render pages
  useEffect(() => {
    if (!pdfDocument || pages.length === 0) return;

    const renderPages = async () => {
        for (const pageData of pages) {
            const canvas = canvasRefs.current[pageData.pageNum];
            if (canvas) {
                try {
                    const page = await pdfDocument.getPage(pageData.pageNum);
                    const viewport = page.getViewport({ scale: 1.5 });

                    const context = canvas.getContext('2d');
                    if (context) {
                        // Always set dimensions to ensure proper sizing
                        canvas.width = viewport.width;
                        canvas.height = viewport.height;

                        await page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise;
                    }
                } catch (error) {
                    console.error(`Error rendering page ${pageData.pageNum}:`, error);
                }
            }
        }
    };

    renderPages();
  }, [pdfDocument, pages]);

  const addSignatureBox = (signatureData: string) => {
     // Load image to get its actual dimensions
     const img = new Image();
     img.onload = () => {
         const pageIndex = 0;
         const page = pages[pageIndex];
         if (!page) return;

         // Calculate dimensions to fit nicely while preserving aspect ratio
         const imageAspectRatio = img.width / img.height;

         // Set a reasonable max width for signatures (e.g., 1/3 of page width)
         const maxWidth = page.width / 3;
         let width = maxWidth;
         let height = width / imageAspectRatio;

         // If too tall, constrain by height instead
         const maxHeight = page.height / 4;
         if (height > maxHeight) {
             height = maxHeight;
             width = height * imageAspectRatio;
         }

         const x = (page.width - width) / 2; // Center X
         const y = (page.height - height) / 2; // Center Y

         const newBox: SignatureBoxType = {
             id: `sig-${Date.now()}`,
             type: 'signature',
             pageIndex: pageIndex,
             signatureData: signatureData,
             x: x,
             y: y,
             width: width,
             height: height,
             rotation: 0,
             opacity: 1,
             maintainAspectRatio: true,
             includeDate: false,
             dateFormat: 'MM/DD/YYYY',
             datePosition: 'below',
             includeText: false,
             textContent: '',
             textPosition: 'below',
             isSelected: true,
             isDragging: false,
             isResizing: false,
             zIndex: signatureBoxes.length + 1
         };

         setSignatureBoxes(prev => [...prev, newBox]);
         setSelectedBoxId(newBox.id);
     };

     img.src = signatureData;
  };

  const updateBox = (id: string, updates: Partial<SignatureBoxType>) => {
      setSignatureBoxes(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBox = (id: string) => {
      setSignatureBoxes(prev => prev.filter(b => b.id !== id));
      if (selectedBoxId === id) setSelectedBoxId(null);
  };

  const handlePageClick = (e: React.MouseEvent, pageIndex: number) => {
      if (e.target === e.currentTarget) {
          // Deselect
          setSelectedBoxId(null);

          // If we had a "Place Signature" mode, we would add it here.
          // For now, just deselect.
      }
  };

  const downloadPDF = async () => {
     if (!file) return;
     setIsProcessing(true);

     try {
         const arrayBuffer = await file.file.arrayBuffer();
         const pdfDoc = await PDFDocument.load(arrayBuffer);

         const modifiedPdf = await addSignatureToPDF(pdfDoc, signatureBoxes);

         const pdfBytes = await modifiedPdf.save();
         const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
         const url = URL.createObjectURL(blob);

         const link = document.createElement('a');
         link.href = url;
         link.download = `signed-${file.file.name}`;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         URL.revokeObjectURL(url);
     } catch (e) {
         console.error("Error saving PDF", e);
         alert(t('saveError') || "Failed to save PDF");
     } finally {
         setIsProcessing(false);
     }
  };

  if (!file) {
      return (
          <div className="container mx-auto py-10 max-w-4xl">
             <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                <p className="text-gray-500">{t('subtitle')}</p>
             </div>
             <FileDropZone onFilesSelected={handleFileSelected} multiple={false} maxFiles={1} />
          </div>
      )
  }

  const selectedBox = signatureBoxes.find(b => b.id === selectedBoxId);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-100">
       {/* Toolbar */}
       <div className="h-16 bg-white border-b flex items-center px-4 justify-between shrink-0 z-50">
          <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> {tCommon('back')}
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <Button onClick={() => setShowModal(true)} className="gap-2">
                  <PenTool className="w-4 h-4" /> {t('addSignature')}
              </Button>
          </div>

          <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
                  <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))}>
                  <ZoomIn className="w-4 h-4" />
              </Button>
          </div>

          <Button onClick={downloadPDF} disabled={isProcessing || signatureBoxes.length === 0}>
              {isProcessing ? tCommon('processing') : (
                  <>
                    <Download className="w-4 h-4 mr-2" /> {t('savePdf')}
                  </>
              )}
          </Button>
       </div>

       <div className="flex flex-1 overflow-hidden">
           {/* Editor Canvas */}
           <div className="flex-1 overflow-auto bg-gray-100 p-8">
              <div className="flex flex-col gap-8 items-center" style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
                  {pages.map((page, index) => (
                      <div
                         key={page.pageNum}
                         className="relative bg-white shadow-lg"
                         style={{
                             width: page.width,
                             height: page.height,
                         }}
                      >
                         <canvas
                             ref={(el) => { canvasRefs.current[page.pageNum] = el; }}
                             className="absolute top-0 left-0 pointer-events-none"
                         />

                         {/* Interaction Layer */}
                         <div
                             className="absolute inset-0 z-10"
                             onClick={(e) => handlePageClick(e, index)}
                         >
                             {signatureBoxes.filter(b => b.pageIndex === index).map(box => (
                                 <SignatureBox
                                    key={box.id}
                                    box={box}
                                    isSelected={box.id === selectedBoxId}
                                    onSelect={setSelectedBoxId}
                                    onUpdate={updateBox}
                                    onDelete={deleteBox}
                                    zoom={1} // The scale is handled by the parent div transform
                                 />
                             ))}
                         </div>
                      </div>
                  ))}
              </div>
           </div>

           {/* Properties Panel (Sidebar) */}
           {selectedBox && (
               <div className="w-80 bg-white border-l p-4 overflow-y-auto shrink-0 animate-in slide-in-from-right duration-200">
                   <h3 className="font-semibold mb-4 text-lg">{t('properties')}</h3>

                   <div className="space-y-6">
                       <div className="space-y-2">
                           <label className="text-sm font-medium">{t('position')}</label>
                           <div className="grid grid-cols-2 gap-2">
                               <div className="flex items-center gap-2 border rounded px-2">
                                   <span className="text-gray-500 text-xs">X</span>
                                   <input
                                     type="number"
                                     value={Math.round(selectedBox.x)}
                                     onChange={(e) => updateBox(selectedBox.id, { x: parseInt(e.target.value) })}
                                     className="w-full py-1 text-sm outline-none"
                                   />
                               </div>
                               <div className="flex items-center gap-2 border rounded px-2">
                                   <span className="text-gray-500 text-xs">Y</span>
                                   <input
                                     type="number"
                                     value={Math.round(selectedBox.y)}
                                     onChange={(e) => updateBox(selectedBox.id, { y: parseInt(e.target.value) })}
                                     className="w-full py-1 text-sm outline-none"
                                   />
                               </div>
                           </div>
                       </div>

                       <div className="space-y-2">
                           <label className="text-sm font-medium">{t('appearance')}</label>

                           {/* Rotation Control */}
                           <div className="space-y-2">
                               <span className="text-sm text-gray-500 block">{t('rotate')}</span>
                               <div className="flex items-center gap-2">
                                   <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => updateBox(selectedBox.id, { rotation: (selectedBox.rotation - 90) % 360 })}
                                       title={t('rotateLeft')}
                                   >
                                       <RotateCcw className="w-4 h-4" />
                                   </Button>
                                   <input
                                      type="range" min="0" max="360"
                                      value={selectedBox.rotation}
                                      onChange={(e) => updateBox(selectedBox.id, { rotation: parseInt(e.target.value) })}
                                      className="flex-1"
                                   />
                                   <Button
                                       variant="outline"
                                       size="sm"
                                       onClick={() => updateBox(selectedBox.id, { rotation: (selectedBox.rotation + 90) % 360 })}
                                       title={t('rotateRight')}
                                   >
                                       <RotateCw className="w-4 h-4" />
                                   </Button>
                               </div>
                           </div>

                           <div className="flex items-center justify-between">
                               <span className="text-sm text-gray-500">{t('opacity')}</span>
                               <input
                                  type="range" min="0" max="1" step="0.1"
                                  value={selectedBox.opacity}
                                  onChange={(e) => updateBox(selectedBox.id, { opacity: parseFloat(e.target.value) })}
                                  className="w-32"
                               />
                           </div>
                       </div>

                       <div className="space-y-2 pt-4 border-t">
                           <div className="flex items-center gap-2">
                               <input
                                 type="checkbox"
                                 checked={selectedBox.includeDate}
                                 onChange={(e) => updateBox(selectedBox.id, { includeDate: e.target.checked })}
                                 id="inc-date"
                                 className="rounded border-gray-300"
                               />
                               <label htmlFor="inc-date" className="text-sm font-medium">{t('addDateStamp')}</label>
                           </div>

                           {selectedBox.includeDate && (
                               <div className="pl-6 space-y-2">
                                   <select
                                      className="w-full text-sm border rounded p-1"
                                      value={selectedBox.datePosition}
                                      onChange={(e) => updateBox(selectedBox.id, { datePosition: e.target.value as any })}
                                   >
                                       <option value="below">{t('datePositionBelow')}</option>
                                       <option value="above">{t('datePositionAbove')}</option>
                                   </select>
                               </div>
                           )}
                       </div>

                       <div className="pt-4 border-t">
                           <Button
                               variant="destructive"
                               className="w-full"
                               onClick={() => deleteBox(selectedBox.id)}
                           >
                               {t('deleteSignature')}
                           </Button>
                       </div>
                   </div>
               </div>
           )}
       </div>

       <SignatureCreationModal
           open={showModal}
           onOpenChange={setShowModal}
           onSave={addSignatureBox}
       />
    </div>
  )
}
