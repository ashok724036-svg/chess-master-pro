// ============================================================
// chess.types.ts — Strict TypeScript Types for ChessMaster Pro
// ============================================================

export type Color = 'w' | 'b';
export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PromotionPiece = 'q' | 'r' | 'b' | 'n';
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
export type Square = `${File}${Rank}`;

export interface Piece {
  type: PieceType;
  color: Color;
}

export interface Move {
  from: Square;
  to: Square;
  piece: PieceType;
  captured?: PieceType;
  promotion?: PromotionPiece;
  flags: string;
  san: string;
  lan: string;
  before: string; // FEN before move
  after: string;  // FEN after move
}

export interface HistoryEntry {
  san: string;
  lan: string;
  fen: string;
  moveNumber: number;
  color: Color;
  timestamp: number;
}

export type GameStatus =
  | 'playing'
  | 'checkmate'
  | 'stalemate'
  | 'draw_insufficient'
  | 'draw_threefold'
  | 'draw_fifty_move'
  | 'draw_agreement'
  | 'resignation'
  | 'timeout';

export interface GameResult {
  status: GameStatus;
  winner: Color | 'draw' | null;
  message: string;
}

export interface TimeControl {
  label: string;
  seconds: number;
  increment: number;
  category: 'bullet' | 'blitz' | 'rapid' | 'classical';
}

export interface ClockState {
  white: number; // ms remaining
  black: number; // ms remaining
  activeColor: Color | null;
  running: boolean;
}

export interface EngineAnalysis {
  bestMove: string | null;
  evaluation: number; // centipawns, positive = white advantage
  depth: number;
  pv: string[]; // principal variation
  mate: number | null; // moves to mate, null if no forced mate
  loading: boolean;
}

export interface BoardTheme {
  id: string;
  label: string;
  lightSquare: string;
  darkSquare: string;
  highlightLight: string;
  highlightDark: string;
  lastMoveLight: string;
  lastMoveDark: string;
}

export interface PieceTheme {
  id: string;
  label: string;
}

export type SoundEvent = 'move' | 'capture' | 'check' | 'castle' | 'promote' | 'gameover' | 'start';

export interface DragState {
  active: boolean;
  square: Square | null;
  x: number;
  y: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface BoardLayout {
  squareSize: number;
  boardOffset: Position;
  flipped: boolean;
}
