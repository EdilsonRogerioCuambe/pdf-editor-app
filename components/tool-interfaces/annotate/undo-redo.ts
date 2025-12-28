// Undo/Redo system for annotations

import type { Annotation } from './types'

export type ActionType =
  | 'ADD_ANNOTATION'
  | 'UPDATE_ANNOTATION'
  | 'DELETE_ANNOTATION'
  | 'BATCH_UPDATE'

export interface Action {
  type: ActionType
  timestamp: number
  data: {
    annotation?: Annotation
    annotations?: Annotation[]
    annotationId?: string
    updates?: Partial<Annotation>
    previousState?: Annotation
  }
}

export class UndoRedoManager {
  private undoStack: Action[] = []
  private redoStack: Action[] = []
  private maxStackSize: number = 50
  private annotations: Annotation[]
  private onChange: (annotations: Annotation[]) => void

  constructor(annotations: Annotation[], onChange: (annotations: Annotation[]) => void) {
    this.annotations = annotations
    this.onChange = onChange
  }

  /**
   * Update annotations state
   */
  setAnnotations(annotations: Annotation[]) {
    this.annotations = annotations
  }

  /**
   * Record an action
   */
  recordAction(action: Action) {
    this.undoStack.push(action)

    // Limit stack size
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift()
    }

    // Clear redo stack when new action is recorded
    this.redoStack = []
  }

  /**
   * Undo last action
   */
  undo(): boolean {
    if (this.undoStack.length === 0) {
      return false
    }

    const action = this.undoStack.pop()!
    this.redoStack.push(action)

    this.applyUndo(action)
    return true
  }

  /**
   * Redo last undone action
   */
  redo(): boolean {
    if (this.redoStack.length === 0) {
      return false
    }

    const action = this.redoStack.pop()!
    this.undoStack.push(action)

    this.applyRedo(action)
    return true
  }

  /**
   * Apply undo for an action
   */
  private applyUndo(action: Action) {
    let newAnnotations: Annotation[] = []

    switch (action.type) {
      case 'ADD_ANNOTATION':
        // Remove the added annotation
        newAnnotations = this.annotations.filter(
          a => a.id !== action.data.annotation!.id
        )
        break

      case 'UPDATE_ANNOTATION':
        // Restore previous state
        newAnnotations = this.annotations.map(a =>
          a.id === action.data.annotationId ? action.data.previousState! : a
        )
        break

      case 'DELETE_ANNOTATION':
        // Restore the deleted annotation
        newAnnotations = [...this.annotations, action.data.annotation!]
        break

      case 'BATCH_UPDATE':
        // Restore previous annotations
        newAnnotations = action.data.annotations || []
        break
    }

    this.annotations = newAnnotations
    this.onChange(newAnnotations)
  }

  /**
   * Apply redo for an action
   */
  private applyRedo(action: Action) {
    let newAnnotations: Annotation[] = []

    switch (action.type) {
      case 'ADD_ANNOTATION':
        // Re-add the annotation
        newAnnotations = [...this.annotations, action.data.annotation!]
        break

      case 'UPDATE_ANNOTATION':
        // Re-apply the update
        newAnnotations = this.annotations.map(a =>
          a.id === action.data.annotationId
            ? { ...a, ...action.data.updates! } as Annotation
            : a
        )
        break

      case 'DELETE_ANNOTATION':
        // Re-delete the annotation
        newAnnotations = this.annotations.filter(
          a => a.id !== action.data.annotationId
        )
        break

      case 'BATCH_UPDATE':
        // Re-apply batch update
        // This would need more context
        break
    }

    this.annotations = newAnnotations
    this.onChange(newAnnotations)
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  /**
   * Clear all history
   */
  clear() {
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * Get undo stack size
   */
  getUndoStackSize(): number {
    return this.undoStack.length
  }

  /**
   * Get redo stack size
   */
  getRedoStackSize(): number {
    return this.redoStack.length
  }
}

/**
 * Helper function to create action for adding annotation
 */
export function createAddAction(annotation: Annotation): Action {
  return {
    type: 'ADD_ANNOTATION',
    timestamp: Date.now(),
    data: { annotation },
  }
}

/**
 * Helper function to create action for updating annotation
 */
export function createUpdateAction(
  annotationId: string,
  updates: Partial<Annotation>,
  previousState: Annotation
): Action {
  return {
    type: 'UPDATE_ANNOTATION',
    timestamp: Date.now(),
    data: { annotationId, updates, previousState },
  }
}

/**
 * Helper function to create action for deleting annotation
 */
export function createDeleteAction(annotation: Annotation): Action {
  return {
    type: 'DELETE_ANNOTATION',
    timestamp: Date.now(),
    data: { annotation, annotationId: annotation.id },
  }
}

/**
 * Helper function to create batch action
 */
export function createBatchAction(annotations: Annotation[]): Action {
  return {
    type: 'BATCH_UPDATE',
    timestamp: Date.now(),
    data: { annotations },
  }
}
