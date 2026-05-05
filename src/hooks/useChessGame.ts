// ============================================================
// hooks/useChessGame.ts — Core Game State Hook (chess.js)
// ============================================================

import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import {
  Square, Color, Move, HistoryEntry, GameResult,
  GameStatus, PromotionPiece, SoundEvent
} from '../types/chess.types';
import { calculateMaterialDiff } from '../utils/boardUtils';

interface UseChessGameOptions {
  onSoundEvent?: (event: SoundEvent) => void;
  onGameEnd?: (result: GameResult) => void;
}

interface ChessGameState {
  fen: string;
  turn: Color;
  legalMovesFrom: (square: Square) => Square[];
  makeMove: (from: Square, to: Square, promotion?: PromotionPiece) => boolean;
  undoMove: () => void;
  resetGame: () => void;
  history: HistoryEntry[];
  currentMoveIndex: number;
  navigateToMove: (index: number) => void;
  gameResult: GameResult | null;
  isCheck: boolean;
  isGameOver: boolean;
  kingInCheckSquare: Square | null;
  lastMove: { from: Square; to: Square } | null;
  materialDiff: { white: number; black: number; diff: number };
  capturedPieces: { white: string[]; black: string[] };
  resign: (color: Color) => void;
  claimDraw: () => void;
  pgn: string;
  loadFen: (fen: string) => boolean;
  loadPgn: (pgn: string) => boolean;
}

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export function useChessGame(options: UseChessGameOptions = {}): ChessGameState {
  const { onSoundEvent, onGameEnd } = options;
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(STARTING_FEN);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);

  // Sync state from chess.js instance
  const syncState = useCallback(() => {
    setFen(gameRef.current.fen());
  }, []);

  const checkGameOver = useCallback((): GameResult | null => {
    const game = gameRef.current;
    if (game.isCheckmate()) {
      const winner: Color = game.turn() === 'w' ? 'b' : 'w';
      return { status: 'checkmate', winner, message: `${winner === 'w' ? 'White' : 'Black'} wins by checkmate` };
    }
    if (game.isStalemate()) return { status: 'stalemate', winner: 'draw', message: 'Draw by stalemate' };
    if (game.isInsufficientMaterial()) return { status: 'draw_insufficient', winner: 'draw', message: 'Draw by insufficient material' };
    if (game.isThreefoldRepetition()) return { status: 'draw_threefold', winner: 'draw', message: 'Draw by threefold repetition' };
    if (game.isDraw()) return { status: 'draw_fifty_move', winner: 'draw', message: 'Draw by 50-move rule' };
    return null;
  }, []);

  const determineSoundEvent = useCallback((move: any): SoundEvent => {
    const game = gameRef.current;
    if (game.isCheckmate() || game.isGameOver()) return 'gameover';
    if (game.isCheck()) return 'check';
    if (move.flags.includes('k') || move.flags.includes('q')) return 'castle';
    if (move.flags.includes('p')) return 'promote';
    if (move.captured) return 'capture';
    return 'move';
  }, []);

  const makeMove = useCallback((
    from: Square,
    to: Square,
    promotion?: PromotionPiece
  ): boolean => {
    const game = gameRef.current;
    if (gameResult) return false; // Game already over

    try {
      const moveObj: any = { from, to };
      if (promotion) moveObj.promotion = promotion;

      const result = game.move(moveObj);
      if (!result) return false;

      const soundEvent = determineSoundEvent(result);
      onSoundEvent?.(soundEvent);

      const entry: HistoryEntry = {
        san: result.san,
        lan: `${result.from}${result.to}${result.promotion || ''}`,
        fen: game.fen(),
        moveNumber: Math.ceil(game.history().length / 2),
        color: result.color as Color,
        timestamp: Date.now(),
      };

      setHistory(prev => {
        const newHist = [...prev, entry];
        setCurrentMoveIndex(newHist.length - 1);
        return newHist;
      });
      setLastMove({ from: result.from as Square, to: result.to as Square });
      syncState();

      const result_ = checkGameOver();
      if (result_) {
        setGameResult(result_);
        onGameEnd?.(result_);
      }
      return true;
    } catch {
      return false;
    }
  }, [gameResult, determineSoundEvent, onSoundEvent, checkGameOver, syncState, onGameEnd]);

  const undoMove = useCallback(() => {
    const game = gameRef.current;
    const undone = game.undo();
    if (!undone) return;

    setHistory(prev => {
      const newHist = prev.slice(0, -1);
      setCurrentMoveIndex(newHist.length - 1);
      return newHist;
    });
    setLastMove(null);
    setGameResult(null);
    syncState();
  }, [syncState]);

  const resetGame = useCallback(() => {
    gameRef.current = new Chess();
    setFen(STARTING_FEN);
    setHistory([]);
    setCurrentMoveIndex(-1);
    setGameResult(null);
    setLastMove(null);
    onSoundEvent?.('start');
  }, [onSoundEvent]);

  const navigateToMove = useCallback((index: number) => {
    const targetFen = index === -1 ? STARTING_FEN : history[index]?.fen;
    if (!targetFen) return;
    gameRef.current = new Chess(targetFen);
    setFen(targetFen);
    setCurrentMoveIndex(index);
    setLastMove(null); // Clear highlights when browsing
  }, [history]);

  const legalMovesFrom = useCallback((square: Square): Square[] => {
    try {
      return gameRef.current.moves({ square, verbose: true }).map(m => m.to as Square);
    } catch {
      return [];
    }
  }, [fen]); // eslint-disable-line react-hooks/exhaustive-deps

  const resign = useCallback((color: Color) => {
    const winner: Color = color === 'w' ? 'b' : 'w';
    const result: GameResult = {
      status: 'resignation',
      winner,
      message: `${winner === 'w' ? 'White' : 'Black'} wins by resignation`,
    };
    setGameResult(result);
    onGameEnd?.(result);
  }, [onGameEnd]);

  const claimDraw = useCallback(() => {
    const result: GameResult = {
      status: 'draw_agreement',
      winner: 'draw',
      message: 'Draw by agreement',
    };
    setGameResult(result);
    onGameEnd?.(result);
  }, [onGameEnd]);

  const loadFen = useCallback((newFen: string): boolean => {
    try {
      const testGame = new Chess(newFen);
      gameRef.current = testGame;
      setFen(newFen);
      setHistory([]);
      setCurrentMoveIndex(-1);
      setGameResult(null);
      setLastMove(null);
      return true;
    } catch {
      return false;
    }
  }, []);

  const loadPgn = useCallback((pgn: string): boolean => {
    try {
      const newGame = new Chess();
      newGame.loadPgn(pgn);
      gameRef.current = newGame;
      // Rebuild history from loaded game
      const moves = newGame.history({ verbose: true });
      const newHist: HistoryEntry[] = [];
      const tempGame = new Chess();
      moves.forEach((m: any) => {
        tempGame.move(m);
        newHist.push({
          san: m.san,
          lan: `${m.from}${m.to}${m.promotion || ''}`,
          fen: tempGame.fen(),
          moveNumber: Math.ceil(tempGame.history().length / 2),
          color: m.color,
          timestamp: Date.now(),
        });
      });
      setHistory(newHist);
      setCurrentMoveIndex(newHist.length - 1);
      setFen(newGame.fen());
      setLastMove(null);
      setGameResult(checkGameOver());
      return true;
    } catch {
      return false;
    }
  }, [checkGameOver]);

  // Compute derived state
  const game = gameRef.current;
  const currentFen = fen; // Use state for reactivity

  const kingInCheckSquare = useCallback((): Square | null => {
    if (!game.isCheck()) return null;
    const turn = game.turn();
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          const file = 'abcdefgh'[c];
          const rank = String(8 - r);
          return `${file}${rank}` as Square;
        }
      }
    }
    return null;
  }, [currentFen]); // eslint-disable-line react-hooks/exhaustive-deps

  const getCapturedPieces = useCallback(() => {
    const hist = game.history({ verbose: true }) as any[];
    const whiteCaptured: string[] = [];
    const blackCaptured: string[] = [];
    hist.forEach((m: any) => {
      if (m.captured) {
        if (m.color === 'w') blackCaptured.push(m.captured);
        else whiteCaptured.push(m.captured);
      }
    });
    return { white: whiteCaptured, black: blackCaptured };
  }, [currentFen]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    fen: currentFen,
    turn: game.turn() as Color,
    legalMovesFrom,
    makeMove,
    undoMove,
    resetGame,
    history,
    currentMoveIndex,
    navigateToMove,
    gameResult,
    isCheck: game.isCheck(),
    isGameOver: game.isGameOver() || gameResult !== null,
    kingInCheckSquare: kingInCheckSquare(),
    lastMove,
    materialDiff: calculateMaterialDiff(currentFen),
    capturedPieces: getCapturedPieces(),
    resign,
    claimDraw,
    pgn: game.pgn(),
    loadFen,
    loadPgn,
  };
}
