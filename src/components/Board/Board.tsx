// ============================================================
// components/Board/Board.tsx — Drag & Drop Board (React Native)
// ============================================================
// Uses react-native-reanimated + react-native-gesture-handler
// for 60fps piece dragging with zero layout re-renders.
// ============================================================

import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import { Square, BoardTheme, PromotionPiece, Color } from '../../types/chess.types';
import { positionToSquare, squareToTopLeft, isLightSquare, getBoardSquares } from '../../utils/boardUtils';
import { BoardLayout } from '../../types/chess.types';
import { PieceView } from '../Piece/PieceView';
import { PIECE_SYMBOL_MAP } from '../Piece/pieceSymbols';

interface BoardProps {
  fen: string;
  flipped?: boolean;
  theme: BoardTheme;
  selectedSquare: Square | null;
  legalMoveSquares: Square[];
  lastMove: { from: Square; to: Square } | null;
  kingInCheck: Square | null;
  onSquarePress: (square: Square) => void;
  onDragStart: (square: Square) => void;
  onDragEnd: (from: Square, to: Square | null) => void;
  showCoordinates?: boolean;
  disabled?: boolean;
}

// ── Square Component (pure, memoized) ───────────────────────
interface SquareProps {
  square: Square;
  squareSize: number;
  theme: BoardTheme;
  isSelected: boolean;
  isLegalMove: boolean;
  isLastMove: boolean;
  isCheckSquare: boolean;
  hasPiece: boolean;
  onPress: () => void;
}

const BoardSquare = React.memo(({
  square,
  squareSize,
  theme,
  isSelected,
  isLegalMove,
  isLastMove,
  isCheckSquare,
  hasPiece,
  onPress,
}: SquareProps) => {
  const isLight = isLightSquare(square);

  let backgroundColor = isLight ? theme.lightSquare : theme.darkSquare;
  if (isSelected) backgroundColor = isLight ? theme.highlightLight : theme.highlightDark;
  else if (isLastMove) backgroundColor = isLight ? theme.lastMoveLight : theme.lastMoveDark;
  if (isCheckSquare) backgroundColor = 'rgba(220, 50, 50, 0.85)';

  return (
    <View
      style={[
        styles.square,
        { width: squareSize, height: squareSize, backgroundColor },
      ]}
      onTouchEnd={onPress}
    >
      {isLegalMove && !hasPiece && (
        <View style={[
          styles.legalMoveDot,
          { width: squareSize * 0.28, height: squareSize * 0.28, borderRadius: squareSize * 0.14 }
        ]} />
      )}
      {isLegalMove && hasPiece && (
        <View style={[
          styles.legalMoveRing,
          {
            width: squareSize * 0.9, height: squareSize * 0.9,
            borderRadius: squareSize * 0.45,
            borderWidth: squareSize * 0.06,
          }
        ]} />
      )}
    </View>
  );
}, (prev, next) => (
  prev.isSelected === next.isSelected &&
  prev.isLegalMove === next.isLegalMove &&
  prev.isLastMove === next.isLastMove &&
  prev.isCheckSquare === next.isCheckSquare &&
  prev.hasPiece === next.hasPiece &&
  prev.theme === next.theme
));

// ── Draggable Piece ──────────────────────────────────────────
interface DraggablePieceProps {
  square: Square;
  pieceChar: string;
  squareSize: number;
  layout: BoardLayout;
  onDragStart: (square: Square) => void;
  onDragEnd: (from: Square, to: Square | null) => void;
  onTap: (square: Square) => void;
  disabled: boolean;
}

const DraggablePiece = React.memo(({
  square, pieceChar, squareSize, layout,
  onDragStart, onDragEnd, onTap, disabled,
}: DraggablePieceProps) => {
  const topLeft = squareToTopLeft(square, layout);
  const translateX = useSharedValue(topLeft.x);
  const translateY = useSharedValue(topLeft.y);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(3);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    width: squareSize,
    height: squareSize,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    zIndex: zIndex.value,
  }));

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart((e) => {
      isDragging.value = true;
      startX.value = translateX.value;
      startY.value = translateY.value;
      scale.value = withSpring(1.15, { damping: 12, stiffness: 250 });
      zIndex.value = 100;
      runOnJS(onDragStart)(square);
    })
    .onUpdate((e) => {
      translateX.value = startX.value + e.translationX;
      translateY.value = startY.value + e.translationY;
    })
    .onEnd((e) => {
      isDragging.value = false;
      scale.value = withSpring(1, { damping: 14, stiffness: 300 });
      zIndex.value = 3;

      // Calculate target square from final gesture position
      const absX = startX.value + squareSize / 2 + e.translationX;
      const absY = startY.value + squareSize / 2 + e.translationY;
      const targetSq = positionToSquare(absX, absY, layout);

      if (targetSq && targetSq !== square) {
        runOnJS(onDragEnd)(square, targetSq);
        // Animate to snapped position
        const newPos = squareToTopLeft(targetSq, layout);
        translateX.value = withSpring(newPos.x, { damping: 20, stiffness: 400 });
        translateY.value = withSpring(newPos.y, { damping: 20, stiffness: 400 });
      } else {
        // Snap back
        translateX.value = withSpring(startX.value, { damping: 20, stiffness: 400 });
        translateY.value = withSpring(startY.value, { damping: 20, stiffness: 400 });
        if (!targetSq || targetSq === square) {
          runOnJS(onDragEnd)(square, null);
        }
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(!disabled)
    .maxDuration(200)
    .onStart(() => {
      runOnJS(onTap)(square);
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={animatedStyle}>
        <PieceView char={pieceChar} size={squareSize} />
      </Animated.View>
    </GestureDetector>
  );
});

// ── Parse FEN to piece map ────────────────────────────────────
function parseFenPieces(fen: string): Map<Square, string> {
  const map = new Map<Square, string>();
  const rows = fen.split(' ')[0].split('/');
  const files = 'abcdefgh';

  rows.forEach((row, rowIdx) => {
    let fileIdx = 0;
    for (const char of row) {
      if (isNaN(parseInt(char))) {
        const isWhite = char === char.toUpperCase();
        const type = char.toLowerCase();
        const square = `${files[fileIdx]}${8 - rowIdx}` as Square;
        const key = (isWhite ? 'w' : 'b') + type.toUpperCase();
        map.set(square, PIECE_SYMBOL_MAP[key] || char);
        fileIdx++;
      } else {
        fileIdx += parseInt(char);
      }
    }
  });

  return map;
}

// ── Main Board Component ─────────────────────────────────────
export const ChessBoard: React.FC<BoardProps> = ({
  fen,
  flipped = false,
  theme,
  selectedSquare,
  legalMoveSquares,
  lastMove,
  kingInCheck,
  onSquarePress,
  onDragStart,
  onDragEnd,
  showCoordinates = true,
  disabled = false,
}) => {
  const [boardSize, setBoardSize] = useState(0);
  const boardRef = useRef<View>(null);
  const boardOffsetRef = useRef({ x: 0, y: 0 });

  const squareSize = boardSize / 8;

  const layout: BoardLayout = useMemo(() => ({
    squareSize,
    boardOffset: boardOffsetRef.current,
    flipped,
  }), [squareSize, flipped]);

  const squares = useMemo(() => getBoardSquares(flipped), [flipped]);
  const pieces = useMemo(() => parseFenPieces(fen), [fen]);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setBoardSize(width);
    // Measure absolute position for gesture calculations
    boardRef.current?.measure((x, y, w, h, pageX, pageY) => {
      boardOffsetRef.current = { x: pageX, y: pageY };
    });
  }, []);

  const handleDragEnd = useCallback((from: Square, to: Square | null) => {
    onDragEnd(from, to);
  }, [onDragEnd]);

  const legalSet = useMemo(() => new Set(legalMoveSquares), [legalMoveSquares]);
  const lastMoveSet = useMemo(() =>
    lastMove ? new Set([lastMove.from, lastMove.to]) : new Set<Square>(),
    [lastMove]
  );

  if (boardSize === 0) {
    return <View style={styles.board} onLayout={handleLayout} ref={boardRef} />;
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <View
        ref={boardRef}
        style={[styles.board, { width: boardSize, height: boardSize }]}
        onLayout={handleLayout}
      >
        {/* Layer 1: Static squares */}
        <View style={styles.squaresLayer}>
          {squares.map((sq) => (
            <BoardSquare
              key={sq}
              square={sq}
              squareSize={squareSize}
              theme={theme}
              isSelected={sq === selectedSquare}
              isLegalMove={legalSet.has(sq)}
              isLastMove={lastMoveSet.has(sq)}
              isCheckSquare={sq === kingInCheck}
              hasPiece={pieces.has(sq)}
              onPress={() => onSquarePress(sq)}
            />
          ))}
        </View>

        {/* Layer 2: Draggable pieces (absolute positioned) */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {Array.from(pieces.entries()).map(([sq, char]) => (
            <DraggablePiece
              key={`${sq}-${char}`}
              square={sq}
              pieceChar={char}
              squareSize={squareSize}
              layout={layout}
              onDragStart={onDragStart}
              onDragEnd={handleDragEnd}
              onTap={onSquarePress}
              disabled={disabled}
            />
          ))}
        </View>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  board: {
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 2,
    overflow: 'hidden',
  },
  squaresLayer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  square: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  legalMoveDot: {
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  legalMoveRing: {
    position: 'absolute',
    borderColor: 'rgba(0,0,0,0.18)',
    borderStyle: 'solid',
    backgroundColor: 'transparent',
  },
});
