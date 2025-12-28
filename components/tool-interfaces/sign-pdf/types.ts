export type SignatureMethod = 'draw' | 'type' | 'upload' | 'saved';

export interface SignatureData {
  method: SignatureMethod;
  data: string; // Base64 image
  text?: string;
  font?: string;
  color?: string;
  createdAt: string;
}

export interface SignatureBox {
  id: string;
  type: 'signature';
  pageIndex: number;

  // Signature data
  signatureData: string; // Base64 image

  // Position and size
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;

  // Appearance
  opacity: number;
  maintainAspectRatio: boolean;

  // Additional elements
  includeDate: boolean;
  dateFormat: string;
  datePosition: 'below' | 'above' | 'left' | 'right';
  includeText: boolean;
  textContent: string;
  textPosition: 'below' | 'above';

  // State
  isSelected: boolean;
  isDragging: boolean;
  isResizing: boolean;
  zIndex: number;
}
