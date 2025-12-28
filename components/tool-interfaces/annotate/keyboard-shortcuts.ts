// Keyboard shortcuts handler for annotation interface

import type { AnnotationTool } from './types'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  description: string
  action: () => void
}

export const SHORTCUTS_MAP: Record<string, string> = {
  h: 'Activate Highlight tool',
  d: 'Activate Draw tool',
  s: 'Activate Shapes tool',
  t: 'Activate Text tool',
  n: 'Add Sticky Note',
  v: 'Activate Cursor (selection)',
  p: 'Activate Hand/Pan tool',
  e: 'Activate Eraser',
  Delete: 'Delete selected annotation',
  Backspace: 'Delete selected annotation',
  'Ctrl+Z': 'Undo',
  'Ctrl+Y': 'Redo',
  'Ctrl+Shift+Z': 'Redo',
  'Ctrl+S': 'Save PDF',
  Escape: 'Deselect all',
  '+': 'Zoom in',
  '=': 'Zoom in',
  '-': 'Zoom out',
  '_': 'Zoom out',
  '0': 'Reset zoom to 100%',
}

export interface KeyboardShortcutHandlers {
  onToolChange: (tool: AnnotationTool) => void
  onUndo: () => void
  onRedo: () => void
  onSave: () => void
  onDelete: () => void
  onDeselect: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
}

/**
 * Create keyboard event handler
 */
export function createKeyboardHandler(handlers: KeyboardShortcutHandlers) {
  return (event: KeyboardEvent) => {
    // Don't handle shortcuts if user is typing in an input
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    const { key, ctrlKey, metaKey, shiftKey } = event
    const modifier = ctrlKey || metaKey

    // Tool shortcuts (single key)
    if (!modifier && !shiftKey) {
      switch (key.toLowerCase()) {
        case 'h':
          event.preventDefault()
          handlers.onToolChange('highlight')
          break
        case 'd':
          event.preventDefault()
          handlers.onToolChange('draw')
          break
        case 's':
          event.preventDefault()
          handlers.onToolChange('shape')
          break
        case 't':
          event.preventDefault()
          handlers.onToolChange('text')
          break
        case 'n':
          event.preventDefault()
          handlers.onToolChange('note')
          break
        case 'v':
          event.preventDefault()
          handlers.onToolChange('cursor')
          break
        case 'p':
          event.preventDefault()
          handlers.onToolChange('hand')
          break
        case 'e':
          event.preventDefault()
          handlers.onToolChange('eraser')
          break
        case 'delete':
        case 'backspace':
          event.preventDefault()
          handlers.onDelete()
          break
        case 'escape':
          event.preventDefault()
          handlers.onDeselect()
          break
        case '+':
        case '=':
          event.preventDefault()
          handlers.onZoomIn()
          break
        case '-':
        case '_':
          event.preventDefault()
          handlers.onZoomOut()
          break
        case '0':
          event.preventDefault()
          handlers.onZoomReset()
          break
      }
    }

    // Modifier shortcuts
    if (modifier) {
      switch (key.toLowerCase()) {
        case 'z':
          event.preventDefault()
          if (shiftKey) {
            handlers.onRedo()
          } else {
            handlers.onUndo()
          }
          break
        case 'y':
          event.preventDefault()
          handlers.onRedo()
          break
        case 's':
          event.preventDefault()
          handlers.onSave()
          break
      }
    }
  }
}

/**
 * Format shortcut for display
 */
export function formatShortcut(shortcut: string): string {
  return shortcut
    .replace('Ctrl+', '⌘')
    .replace('Shift+', '⇧')
    .replace('Alt+', '⌥')
}
