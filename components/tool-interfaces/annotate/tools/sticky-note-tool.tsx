"use client"

import { type NoteAnnotation, type NoteSettings } from "../types"

interface StickyNoteToolProps {
  pageIndex: number
  scale: number
  settings: NoteSettings
  onAddAnnotation: (annotation: NoteAnnotation) => void
  isActive: boolean
  author: string
}

export function StickyNoteTool({
  pageIndex,
  scale,
  settings,
  onAddAnnotation,
  isActive,
  author,
}: StickyNoteToolProps) {

  const handleClick = (e: React.MouseEvent) => {
    if (!isActive) return

    if (e.target !== e.currentTarget) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    const annotation: NoteAnnotation = {
      id: `note-${Date.now()}`,
      type: 'note',
      pageIndex,
      x: x - 12,
      y: y - 12,
      width: 24,
      height: 24,
      rotation: 0,
      opacity: 1,

      noteColor: settings.color,
      noteTitle: 'Note',
      noteContent: '',
      noteAuthor: author,
      noteTimestamp: new Date().toISOString(),
      noteExpanded: true,

      zIndex: 1,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      author,
      isSelected: true,
      isEditing: true,
      isVisible: true
    }

    onAddAnnotation(annotation)
  }

  if (!isActive) return null

  return (
    <div
      className="absolute inset-0 z-50 cursor-copy"
      onClick={handleClick}
      style={{
        cursor: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.5 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V8.5L15.5 3Z"/><path d="M15 3v6h6"/></svg>') 12 12, auto`
      }}
    />
  )
}
