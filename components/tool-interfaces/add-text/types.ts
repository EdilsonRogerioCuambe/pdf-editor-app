export interface TextBox {
  id: string;
  pageIndex: number; // which page (0-indexed)
  content: string;
  x: number; // position in pixels (relative to page)
  y: number;
  width: number; // can be auto or fixed
  height: number; // auto-calculated from content
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number; // normal, bold
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  color: string;
  opacity: number;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  letterSpacing: number;
  rotation: number; // degrees
  zIndex: number;

  // Background
  hasBackground: boolean;
  backgroundColor: string;
  backgroundOpacity: number;
  backgroundPadding: number;
  backgroundBorderRadius: number;

  // Border
  hasBorder: boolean;
  borderColor: string;
  borderWidth: number;
  borderStyle: 'solid' | 'dashed' | 'dotted';

  // Effects
  hasShadow: boolean;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  shadowColor: string;

  hasOutline: boolean;
  outlineWidth: number;
  outlineColor: string;

  // State
  isSelected: boolean;
  isEditing: boolean;
}
