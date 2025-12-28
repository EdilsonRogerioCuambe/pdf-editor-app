import * as pdfjsLib from "pdfjs-dist"

// Ensure worker is set up in the main component, but we import types here

export interface PDFAnalysisResult {
  totalPages: number
  hasText: boolean
  hasImages: boolean
  textRatio: number // 0 to 1 (normalized score)
  imageQualityEstimation: number // 0 to 100
  alreadyCompressed: boolean
  compressionPotential: number // 0 to 100
  recommendation: 'low' | 'medium' | 'high'
  warnings: string[]
  minSafeQuality: number // 0 to 1
}

export async function analyzePDF(file: File): Promise<PDFAnalysisResult> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument(arrayBuffer)
  const pdf = await loadingTask.promise

  let totalTextLength = 0
  let totalImages = 0
  let lowResImages = 0
  let totalOps = 0

  const numPagesToAnalyze = Math.min(pdf.numPages, 5) // Analyze first 5 pages to be fast

  for (let i = 1; i <= numPagesToAnalyze; i++) {
    const page = await pdf.getPage(i)

    // Text Analysis
    const textContent = await page.getTextContent()
    const text = textContent.items.map((item: any) => item.str).join(' ')
    totalTextLength += text.length

    // Image Analysis (Heuristic via OperatorList)
    try {
        const ops = await page.getOperatorList()
        totalOps += ops.fnArray.length

        for (let j = 0; j < ops.fnArray.length; j++) {
            if (ops.fnArray[j] === pdfjsLib.OPS.paintImageXObject ||
                ops.fnArray[j] === pdfjsLib.OPS.paintInlineImageXObject) {
                totalImages++

                // Very rough heuristic: Check args for dimensions if available
                // Note: accurate quality detection is hard without extracting the image stream
                // We'll rely more on text-to-file-size ratio and metadata indicators later
            }
        }
    } catch (e) {
        console.warn("Failed to analyze page ops", e)
    }
  }

  const fileSizeMB = file.size / (1024 * 1024)
  const avgTextPerPage = totalTextLength / numPagesToAnalyze

  // Heuristics
  const isTextHeavy = avgTextPerPage > 500 // >500 chars per page is likely a text doc
  const hasImages = totalImages > 0

  // Adjusted text ratio calculation
  const textRatio = Math.min(1, avgTextPerPage / 2000)

  // Check if likely already compressed
  // If file size is small (< 500KB) and has many images/pages, it's likely compressed
  // Or if Ops count is high but file size is low
  const efficiencyScore = (totalImages + totalTextLength / 100) / (fileSizeMB + 0.1)
  const alreadyCompressed = efficiencyScore > 1000 || (hasImages && fileSizeMB < 0.2 * numPagesToAnalyze)

  let compressionPotential = 50 // Default medium
  const warnings: string[] = []

  if (isTextHeavy) {
      compressionPotential = 20
      warnings.push("This document contains a lot of text. Aggressive compression will convert text to images, making it unsearchable and potentially blurry.")
  } else if (alreadyCompressed) {
      compressionPotential = 10
      warnings.push("This PDF appears to be already highly optimized. Further compression may destroy quality with minimal size gains.")
  } else if (hasImages && fileSizeMB > 1.0) {
      compressionPotential = 90
  }

  // Safety limits
  let minSafeQuality = 0.5
  if (isTextHeavy) minSafeQuality = 0.75
  if (alreadyCompressed) minSafeQuality = 0.8

  return {
    totalPages: pdf.numPages,
    hasText: isTextHeavy,
    hasImages,
    textRatio,
    imageQualityEstimation: alreadyCompressed ? 40 : 90, // Guess
    alreadyCompressed,
    compressionPotential,
    recommendation: isTextHeavy || alreadyCompressed ? 'low' : 'medium',
    warnings,
    minSafeQuality
  }
}

export function validateCompressionSettings(
    analysis: PDFAnalysisResult,
    quality: number // 0-1
): { valid: boolean, message?: string } {
    if (quality < analysis.minSafeQuality) {
        return {
            valid: false,
            message: `Quality too low for this document type (Min: ${Math.round(analysis.minSafeQuality * 100)}%).`
        }
    }
    return { valid: true }
}
