// ============================================================
// components/Piece/pieceSymbols.ts — Piece character mapping
// ============================================================

// Unicode chess pieces (high-quality rendering)
export const PIECE_SYMBOL_MAP: Record<string, string> = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

// ============================================================
// components/Piece/PieceView.tsx — Piece Rendering Component
// ============================================================
// For production: Replace Text with SvgUri pointing to your SVG assets.
// SVG path: /assets/pieces/svg/wK.svg, bQ.svg, etc.
// Using react-native-svg:
//   import { SvgUri } from 'react-native-svg';
//   <SvgUri uri={require(`../../assets/pieces/svg/${pieceKey}.svg`)} width={size} height={size} />
// ============================================================
