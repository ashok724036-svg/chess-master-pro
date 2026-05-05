// ============================================================
// utils/boardUtils.ts — Coordinate & Board Helper Functions
// ============================================================

import { Square, File, Rank, BoardLayout, Position } from '../types/chess.types';

const FILES: File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS: Rank[] = ['1', '2', '3', '4', '5', '6', '7', '8'];

/**
 * Convert screen pixel position to board square
 */
export function positionToSquare(
  x: number,
  y: number,
  layout: BoardLayout
): Square | null {
  const { squareSize, boardOffset, flipped } = layout;
  const relX = x - boardOffset.x;
  const relY = y - boardOffset.y;

  if (relX < 0 || relY < 0 || relX >= squareSize * 8 || relY >= squareSize * 8) {
    return null;
  }

  const fileIdx = flipped ? 7 - Math.floor(relX / squareSize) : Math.floor(relX / squareSize);
  const rankIdx = flipped ? Math.floor(relY / squareSize) : 7 - Math.floor(relY / squareSize);

  if (fileIdx < 0 || fileIdx > 7 || rankIdx < 0 || rankIdx > 7) return null;

  return `${FILES[fileIdx]}${RANKS[rankIdx]}` as Square;
}

/**
 * Convert board square to screen pixel center position
 */
export function squareToPosition(
  square: Square,
  layout: BoardLayout
): Position {
  const { squareSize, boardOffset, flipped } = layout;
  const fileIdx = FILES.indexOf(square[0] as File);
  const rankIdx = RANKS.indexOf(square[1] as Rank);

  const visualFileIdx = flipped ? 7 - fileIdx : fileIdx;
  const visualRankIdx = flipped ? rankIdx : 7 - rankIdx;

  return {
    x: boardOffset.x + visualFileIdx * squareSize + squareSize / 2,
    y: boardOffset.y + visualRankIdx * squareSize + squareSize / 2,
  };
}

/**
 * Get top-left pixel position of a square
 */
export function squareToTopLeft(
  square: Square,
  layout: BoardLayout
): Position {
  const center = squareToPosition(square, layout);
  return {
    x: center.x - layout.squareSize / 2,
    y: center.y - layout.squareSize / 2,
  };
}

/**
 * Determine if a square is light or dark
 */
export function isLightSquare(square: Square): boolean {
  const fileIdx = FILES.indexOf(square[0] as File);
  const rankIdx = RANKS.indexOf(square[1] as Rank);
  return (fileIdx + rankIdx) % 2 !== 0;
}

/**
 * Get all squares in order for board rendering (top-left to bottom-right)
 */
export function getBoardSquares(flipped: boolean): Square[] {
  const squares: Square[] = [];
  for (let rankIdx = 7; rankIdx >= 0; rankIdx--) {
    for (let fileIdx = 0; fileIdx < 8; fileIdx++) {
      const rank = RANKS[flipped ? 7 - rankIdx : rankIdx];
      const file = FILES[flipped ? 7 - fileIdx : fileIdx];
      squares.push(`${file}${rank}` as Square);
    }
  }
  return squares;
}

/**
 * Parse algebraic notation to square
 */
export function parseSquare(notation: string): Square | null {
  if (notation.length !== 2) return null;
  const file = notation[0] as File;
  const rank = notation[1] as Rank;
  if (!FILES.includes(file) || !RANKS.includes(rank)) return null;
  return `${file}${rank}` as Square;
}

/**
 * Get rank label for display (accounting for flip)
 */
export function getRankLabels(flipped: boolean): string[] {
  return flipped ? ['1','2','3','4','5','6','7','8'] : ['8','7','6','5','4','3','2','1'];
}

/**
 * Get file labels for display (accounting for flip)
 */
export function getFileLabels(flipped: boolean): string[] {
  return flipped ? ['h','g','f','e','d','c','b','a'] : ['a','b','c','d','e','f','g','h'];
}

/**
 * Format move time in mm:ss format
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Format time with tenths of seconds (for <10 second display)
 */
export function formatTimePrecise(ms: number): string {
  if (ms >= 10000) return formatTime(ms);
  const seconds = Math.floor(ms / 1000);
  const tenths = Math.floor((ms % 1000) / 100);
  return `0:0${seconds}.${tenths}`;
}

/**
 * Calculate material advantage from FEN
 */
export function calculateMaterialDiff(fen: string): { white: number; black: number; diff: number } {
  const VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
  const position = fen.split(' ')[0];
  let white = 0, black = 0;

  for (const char of position) {
    const lower = char.toLowerCase();
    if (VALUES[lower]) {
      if (char === char.toUpperCase()) white += VALUES[lower];
      else black += VALUES[lower];
    }
  }
  return { white, black, diff: white - black };
}
