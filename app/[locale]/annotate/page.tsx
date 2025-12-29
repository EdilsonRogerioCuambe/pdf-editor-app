import { AnnotationInterface } from '@/components/tool-interfaces/annotate-interface'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Annotate PDF | PDF Master',
  description: 'Add highlights, drawings, shapes, text annotations, and notes to your PDF files',
}

export default function AnnotatePage() {
  return <AnnotationInterface />
}
