import { useState, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { EngineAnalysis } from '../types/chess.types';

interface UseStockfishOptions {
  depth?: number;
  enabled?: boolean;
}

const NULL_ANALYSIS: EngineAnalysis = {
  bestMove: null, evaluation: 0, depth: 0, pv: [], mate: null, loading: false,
};

const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
};

function evaluatePosition(game: Chess): number {
  if (game.isCheckmate()) return game.turn() === 'w' ? -10000 : 10000;
  if (game.isDraw() || game.isStalemate()) return 0;
  let score = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const value = PIECE_VALUES[piece.type] || 0;
      score += piece.color === 'w' ? value : -value;
    }
  }
  return score;
}

function minimax(game: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (depth === 0 || game.isGameOver()) return evaluatePosition(game);
  const moves = game.moves();
  if (maximizing) {
    let best = -Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.max(best, minimax(game, depth - 1, alpha, beta, false));
      game.undo();
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const move of moves) {
      game.move(move);
      best = Math.min(best, minimax(game, depth - 1, alpha, beta, true));
      game.undo();
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function useStockfish({ depth = 3, enabled = true }: UseStockfishOptions = {}) {
  const [analysis, setAnalysis] = useState<EngineAnalysis>(NULL_ANALYSIS);
  const cancelRef = useRef(false);

  const analyze = useCallback((fen: string) => {
    if (!enabled) return;
    cancelRef.current = false;
    setAnalysis(prev => ({ ...prev, loading: true }));
    setTimeout(() => {
      if (cancelRef.current) return;
      try {
        const game = new Chess(fen);
        const moves = game.moves({ verbose: true }) as any[];
        if (moves.length === 0) { setAnalysis(NULL_ANALYSIS); return; }
        const isMaximizing = game.turn() === 'w';
        let bestMove = `${moves[0].from}${moves[0].to}`;
        let bestVal = isMaximizing ? -Infinity : Infinity;
        for (const move of moves) {
          if (cancelRef.current) return;
          game.move(move);
          const val = minimax(game, Math.max(1, depth - 1), -Infinity, Infinity, !isMaximizing);
          game.undo();
          if (isMaximizing ? val > bestVal : val < bestVal) {
            bestVal = val;
            bestMove = `${move.from}${move.to}${move.promotion || ''}`;
          }
        }
        if (!cancelRef.current) {
          setAnalysis({ bestMove, evaluation: bestVal / 100, depth, pv: [bestMove], mate: null, loading: false });
        }
      } catch { setAnalysis(NULL_ANALYSIS); }
    }, 0);
  }, [enabled, depth]);

  const cancel = useCallback(() => { cancelRef.current = true; setAnalysis(NULL_ANALYSIS); }, []);
  return { analysis, analyze, cancel, isReady: true };
}
