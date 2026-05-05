// ChessMaster Pro — Main Entry Point
// Built with React Native + Expo

import React, { useState, useCallback } from 'react';
import {
  View, Text, StatusBar, StyleSheet, SafeAreaView,
  Pressable, Modal, ScrollView, useWindowDimensions,
} from 'react-native';
import Animated, { FadeInDown, SlideInRight } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useChessGame } from './src/hooks/useChessGame';
import { useClock } from './src/hooks/useClock';
import { useSounds } from './src/hooks/useSounds';
import { useStockfish } from './src/engine/stockfish.hook';
import { ChessBoard } from './src/components/Board/Board';
import { MoveHistory } from './src/components/MoveHistory/MoveHistory';
import {
  Square, Color, PromotionPiece, GameResult, BoardTheme, TimeControl, SoundEvent,
} from './src/types/chess.types';
import { BOARD_THEMES, TIME_CONTROLS, APP_COLORS, DEFAULT_TIME_CONTROL } from './src/theme';
import { formatTime } from './src/utils/boardUtils';

const PROMO_PIECES: { type: PromotionPiece; wSymbol: string; bSymbol: string }[] = [
  { type: 'q', wSymbol: '♕', bSymbol: '♛' },
  { type: 'r', wSymbol: '♖', bSymbol: '♜' },
  { type: 'b', wSymbol: '♗', bSymbol: '♝' },
  { type: 'n', wSymbol: '♘', bSymbol: '♞' },
];

const PromotionDialog: React.FC<{ color: Color; onSelect: (p: PromotionPiece) => void; onDismiss: () => void }> = ({ color, onSelect, onDismiss }) => (
  <Modal transparent animationType="fade" onRequestClose={onDismiss}>
    <View style={dlg.backdrop}>
      <Animated.View entering={FadeInDown.springify()} style={dlg.card}>
        <Text style={dlg.title}>Promote Pawn</Text>
        <View style={dlg.pieceRow}>
          {PROMO_PIECES.map(p => (
            <Pressable key={p.type} style={dlg.pieceBtn} onPress={() => onSelect(p.type)}>
              <Text style={dlg.pieceChar}>{color === 'w' ? p.wSymbol : p.bSymbol}</Text>
              <Text style={dlg.pieceLabel}>{p.type.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  </Modal>
);

const ResultModal: React.FC<{ result: GameResult; onNewGame: () => void; onClose: () => void }> = ({ result, onNewGame, onClose }) => (
  <Modal transparent animationType="fade" onRequestClose={onClose}>
    <View style={dlg.backdrop}>
      <Animated.View entering={FadeInDown.springify().delay(100)} style={[dlg.card, dlg.resultCard]}>
        <Text style={dlg.resultIcon}>
          {result.status === 'checkmate' ? '♟' : result.status === 'timeout' ? '⏰' : '½'}
        </Text>
        <Text style={dlg.resultTitle}>
          {result.status === 'checkmate' ? 'Checkmate!' : result.status === 'resignation' ? 'Resignation' : result.status === 'timeout' ? "Time's Up!" : 'Draw!'}
        </Text>
        <Text style={dlg.resultSubtitle}>{result.message}</Text>
        <View style={dlg.resultActions}>
          <Pressable style={[dlg.actionBtn, dlg.primaryBtn]} onPress={onNewGame}>
            <Text style={dlg.primaryBtnText}>New Game</Text>
          </Pressable>
          <Pressable style={dlg.actionBtn} onPress={onClose}>
            <Text style={dlg.actionBtnText}>Review</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  </Modal>
);

const SettingsPanel: React.FC<{
  visible: boolean; boardTheme: BoardTheme; timeControl: TimeControl;
  soundEnabled: boolean; engineEnabled: boolean;
  onThemeChange: (t: BoardTheme) => void; onTimeChange: (tc: TimeControl) => void;
  onSoundToggle: () => void; onEngineToggle: () => void; onClose: () => void;
}> = ({ visible, boardTheme, timeControl, soundEnabled, engineEnabled, onThemeChange, onTimeChange, onSoundToggle, onEngineToggle, onClose }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={set.backdrop}>
      <Animated.View entering={SlideInRight.springify()} style={set.panel}>
        <View style={set.header}>
          <Text style={set.title}>Settings</Text>
          <Pressable onPress={onClose} style={set.closeBtn}><Text style={set.closeText}>✕</Text></Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={set.sectionTitle}>Board Theme</Text>
          <View style={set.grid}>
            {BOARD_THEMES.map(t => (
              <Pressable key={t.id} style={[set.themeOption, t.id === boardTheme.id && set.themeActive]} onPress={() => onThemeChange(t)}>
                <View style={[set.themePreview, { backgroundColor: t.lightSquare }]}>
                  <View style={[set.themePreviewDark, { backgroundColor: t.darkSquare }]} />
                </View>
                <Text style={set.themeLabel}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={set.sectionTitle}>Time Control</Text>
          <View style={set.tcGrid}>
            {TIME_CONTROLS.map(tc => (
              <Pressable key={tc.label} style={[set.tcChip, tc.label === timeControl.label && set.tcActive]} onPress={() => onTimeChange(tc)}>
                <Text style={[set.tcText, tc.label === timeControl.label && set.tcActiveText]}>{tc.label}</Text>
                <Text style={set.tcCategory}>{tc.category}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={set.sectionTitle}>Options</Text>
          <Pressable style={set.toggleRow} onPress={onSoundToggle}>
            <Text style={set.toggleLabel}>Sound Effects</Text>
            <View style={[set.toggle, soundEnabled && set.toggleOn]}>
              <View style={[set.toggleThumb, soundEnabled && set.toggleThumbOn]} />
            </View>
          </Pressable>
          <Pressable style={set.toggleRow} onPress={onEngineToggle}>
            <Text style={set.toggleLabel}>Engine Analysis</Text>
            <View style={[set.toggle, engineEnabled && set.toggleOn]}>
              <View style={[set.toggleThumb, engineEnabled && set.toggleThumbOn]} />
            </View>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  </Modal>
);

export default function App() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalMoves, setLegalMoves] = useState<Square[]>([]);
  const [promotionPending, setPromotionPending] = useState<{ from: Square; to: Square } | null>(null);
  const [boardFlipped, setBoardFlipped] = useState(false);
  const [boardTheme, setBoardTheme] = useState<BoardTheme>(BOARD_THEMES[0]);
  const [timeControl, setTimeControlState] = useState<TimeControl>(DEFAULT_TIME_CONTROL);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [engineEnabled, setEngineEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const sounds = useSounds({ enabled: soundEnabled });
  const chess = useChessGame({
    onSoundEvent: (event: SoundEvent) => sounds.play(event),
    onGameEnd: () => setShowResult(true),
  });
  const clock = useClock({
    timeControl,
    onTimeout: (color: Color) => { chess.resign(color); setShowResult(true); },
  });
  const engine = useStockfish({ depth: 4, enabled: engineEnabled && !chess.isGameOver });

  const handleSquarePress = useCallback((square: Square) => {
    if (chess.isGameOver) return;
    if (selectedSquare === null) {
      const moves = chess.legalMovesFrom(square);
      if (moves.length > 0) { setSelectedSquare(square); setLegalMoves(moves); }
    } else {
      if (square === selectedSquare) { setSelectedSquare(null); setLegalMoves([]); return; }
      if (legalMoves.includes(square)) { attemptMove(selectedSquare, square); }
      else {
        const moves = chess.legalMovesFrom(square);
        if (moves.length > 0) { setSelectedSquare(square); setLegalMoves(moves); }
        else { setSelectedSquare(null); setLegalMoves([]); }
      }
    }
  }, [selectedSquare, legalMoves, chess]);

  const isPromotionMove = useCallback((from: Square, to: Square): boolean => {
    const fenParts = chess.fen.split(' ');
    const rows = fenParts[0].split('/');
    const files = 'abcdefgh';
    const fileIdx = files.indexOf(from[0]);
    const rankIdx = 8 - parseInt(from[1]);
    if (rankIdx < 0 || rankIdx > 7 || fileIdx < 0 || fileIdx > 7) return false;
    const row = rows[rankIdx];
    let col = 0;
    for (const ch of row) {
      if (!isNaN(parseInt(ch))) { col += parseInt(ch); }
      else {
        if (col === fileIdx) {
          return (ch === 'P' && to[1] === '8') || (ch === 'p' && to[1] === '1');
        }
        col++;
      }
    }
    return false;
  }, [chess.fen]);

  const attemptMove = useCallback((from: Square, to: Square) => {
    setSelectedSquare(null); setLegalMoves([]);
    if (isPromotionMove(from, to)) { setPromotionPending({ from, to }); return; }
    const success = chess.makeMove(from, to);
    if (success) { clock.switchClock(); if (engineEnabled) engine.analyze(chess.fen); }
  }, [chess, clock, engine, engineEnabled, isPromotionMove]);

  const handleNewGame = useCallback(() => {
    chess.resetGame(); clock.resetClock();
    setSelectedSquare(null); setLegalMoves([]); setPromotionPending(null); setShowResult(false);
    engine.cancel();
  }, [chess, clock, engine]);

  const evalBarWidth = (() => {
    const ev = engine.analysis.evaluation;
    if (!isFinite(ev)) return ev > 0 ? '100%' : '0%';
    return `${50 + Math.max(-40, Math.min(40, ev)) * 1.1}%`;
  })();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={APP_COLORS.bg} />
      <SafeAreaView style={s.safeArea}>
        <View style={[s.container, isLandscape && s.containerLandscape]}>
          <View style={s.header}>
            <Text style={s.appTitle}>♛ ChessMaster Pro</Text>
            <View style={s.headerActions}>
              <Pressable style={s.iconBtn} onPress={() => setBoardFlipped(f => !f)}>
                <Text style={s.iconBtnText}>⇅</Text>
              </Pressable>
              <Pressable style={s.iconBtn} onPress={() => setShowSettings(true)}>
                <Text style={s.iconBtnText}>⚙</Text>
              </Pressable>
            </View>
          </View>

          <View style={s.statusBar}>
            <View style={[s.turnDot, { backgroundColor: chess.turn === 'w' ? '#F5F0E8' : '#444' }]} />
            <Text style={s.statusText}>
              {chess.isGameOver ? '● Game Over' : chess.isCheck ? `⚠ ${chess.turn === 'w' ? 'White' : 'Black'} in check!` : `${chess.turn === 'w' ? 'White' : 'Black'} to move`}
            </Text>
            {chess.history.length > 0 && <Text style={s.moveCount}>{Math.ceil(chess.history.length / 2)} moves</Text>}
          </View>

          <View style={[s.mainLayout, isLandscape && s.mainLayoutLandscape]}>
            <View style={s.boardSection}>
              <View style={s.playerRow}>
                <Text style={s.playerEmoji}>{boardFlipped ? '♔' : '♚'}</Text>
                <View style={s.playerInfo}>
                  <Text style={s.playerName}>{boardFlipped ? 'White' : 'Black'}</Text>
                </View>
                <View style={[s.miniClock, clock.activeColor === (boardFlipped ? 'w' : 'b') && s.miniClockActive]}>
                  <Text style={[s.miniClockText, clock.activeColor === (boardFlipped ? 'w' : 'b') && s.miniClockActiveText]}>
                    {formatTime(boardFlipped ? clock.white : clock.black)}
                  </Text>
                </View>
              </View>

              {engineEnabled && (
                <View style={s.evalBarRow}>
                  <View style={s.evalBarBg}>
                    <View style={[s.evalBarFill, { width: evalBarWidth as any }]} />
                  </View>
                  {engine.analysis.bestMove && (
                    <Text style={s.evalLabel}>⚡ {engine.analysis.bestMove} {engine.analysis.evaluation > 0 ? '+' : ''}{engine.analysis.evaluation.toFixed(1)}</Text>
                  )}
                </View>
              )}

              <ChessBoard
                fen={chess.fen} flipped={boardFlipped} theme={boardTheme}
                selectedSquare={selectedSquare} legalMoveSquares={legalMoves}
                lastMove={chess.lastMove} kingInCheck={chess.kingInCheckSquare}
                onSquarePress={handleSquarePress}
                onDragStart={(sq) => { setSelectedSquare(sq); setLegalMoves(chess.legalMovesFrom(sq)); }}
                onDragEnd={(from, to) => { if (to && from !== to) attemptMove(from, to); else { setSelectedSquare(null); setLegalMoves([]); } }}
                disabled={chess.isGameOver}
              />

              <View style={s.playerRow}>
                <Text style={s.playerEmoji}>{boardFlipped ? '♚' : '♔'}</Text>
                <View style={s.playerInfo}>
                  <Text style={s.playerName}>{boardFlipped ? 'Black' : 'White'}</Text>
                </View>
                <View style={[s.miniClock, clock.activeColor === (boardFlipped ? 'b' : 'w') && s.miniClockActive]}>
                  <Text style={[s.miniClockText, clock.activeColor === (boardFlipped ? 'b' : 'w') && s.miniClockActiveText]}>
                    {formatTime(boardFlipped ? clock.black : clock.white)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={s.sidePanel}>
              <MoveHistory history={chess.history} currentMoveIndex={chess.currentMoveIndex} onNavigate={chess.navigateToMove} />
              <View style={s.controls}>
                <View style={s.controlRow}>
                  <Pressable style={[s.btn, s.btnPrimary]} onPress={handleNewGame}>
                    <Text style={s.btnPrimaryText}>New Game</Text>
                  </Pressable>
                  <Pressable style={s.btn} onPress={chess.undoMove}>
                    <Text style={s.btnText}>↩ Undo</Text>
                  </Pressable>
                </View>
                <View style={s.controlRow}>
                  <Pressable style={[s.btn, s.btnDanger]} onPress={() => chess.resign(chess.turn)} disabled={chess.isGameOver}>
                    <Text style={s.btnDangerText}>Resign</Text>
                  </Pressable>
                  <Pressable style={s.btn} onPress={() => { chess.claimDraw(); setShowResult(true); }} disabled={chess.isGameOver}>
                    <Text style={s.btnText}>½ Draw</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {promotionPending && (
        <PromotionDialog color={chess.turn} onSelect={(piece) => {
          if (!promotionPending) return;
          chess.makeMove(promotionPending.from, promotionPending.to, piece);
          clock.switchClock();
          setPromotionPending(null);
        }} onDismiss={() => setPromotionPending(null)} />
      )}

      {showResult && chess.gameResult && (
        <ResultModal result={chess.gameResult} onNewGame={handleNewGame} onClose={() => setShowResult(false)} />
      )}

      <SettingsPanel
        visible={showSettings} boardTheme={boardTheme} timeControl={timeControl}
        soundEnabled={soundEnabled} engineEnabled={engineEnabled}
        onThemeChange={setBoardTheme}
        onTimeChange={(tc) => { setTimeControlState(tc); clock.setTimeControl(tc); handleNewGame(); }}
        onSoundToggle={() => setSoundEnabled(s => !s)}
        onEngineToggle={() => setEngineEnabled(e => !e)}
        onClose={() => setShowSettings(false)}
      />
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: APP_COLORS.bg },
  container: { flex: 1, padding: 12, gap: 8 },
  containerLandscape: { flexDirection: 'row', alignItems: 'flex-start' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appTitle: { fontSize: 20, fontWeight: '700', color: APP_COLORS.accent },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: APP_COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: APP_COLORS.border },
  iconBtnText: { fontSize: 16, color: APP_COLORS.muted },
  statusBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: APP_COLORS.card, borderRadius: 8, padding: 8, borderWidth: 1, borderColor: APP_COLORS.border },
  turnDot: { width: 10, height: 10, borderRadius: 5 },
  statusText: { fontSize: 13, color: APP_COLORS.text, fontWeight: '500', flex: 1 },
  moveCount: { fontSize: 11, color: APP_COLORS.muted },
  mainLayout: { flex: 1, gap: 12 },
  mainLayoutLandscape: { flexDirection: 'row' },
  boardSection: { gap: 6 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  playerEmoji: { fontSize: 20 },
  playerInfo: { flex: 1 },
  playerName: { fontSize: 13, fontWeight: '600', color: APP_COLORS.text },
  miniClock: { backgroundColor: APP_COLORS.card, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: APP_COLORS.border },
  miniClockActive: { backgroundColor: APP_COLORS.accent, borderColor: APP_COLORS.accent },
  miniClockText: { fontSize: 16, fontWeight: '500', color: APP_COLORS.text },
  miniClockActiveText: { color: '#1a1a1a' },
  evalBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  evalBarBg: { height: 6, flex: 1, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden' },
  evalBarFill: { height: '100%', backgroundColor: APP_COLORS.accent, borderRadius: 3 },
  evalLabel: { fontSize: 10, color: APP_COLORS.muted },
  sidePanel: { flex: 1, gap: 8 },
  controls: { gap: 6 },
  controlRow: { flexDirection: 'row', gap: 8 },
  btn: { flex: 1, backgroundColor: APP_COLORS.card, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: APP_COLORS.border },
  btnText: { fontSize: 13, color: APP_COLORS.text, fontWeight: '500' },
  btnPrimary: { backgroundColor: APP_COLORS.accentDim, borderColor: APP_COLORS.accent },
  btnPrimaryText: { fontSize: 13, color: APP_COLORS.accent, fontWeight: '600' },
  btnDanger: { backgroundColor: 'rgba(192,57,43,0.1)', borderColor: APP_COLORS.danger },
  btnDangerText: { fontSize: 13, color: '#e74c3c', fontWeight: '500' },
});

const dlg = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: APP_COLORS.card, borderRadius: 16, padding: 28, borderWidth: 2, borderColor: APP_COLORS.accent, minWidth: 260 },
  resultCard: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: APP_COLORS.accent, marginBottom: 16, textAlign: 'center' },
  pieceRow: { flexDirection: 'row', gap: 12 },
  pieceBtn: { alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: APP_COLORS.bg },
  pieceChar: { fontSize: 42 },
  pieceLabel: { fontSize: 11, color: APP_COLORS.muted, marginTop: 4 },
  resultIcon: { fontSize: 52, marginBottom: 8 },
  resultTitle: { fontSize: 26, fontWeight: '700', color: APP_COLORS.accent, marginBottom: 6 },
  resultSubtitle: { fontSize: 14, color: APP_COLORS.muted, marginBottom: 24, textAlign: 'center' },
  resultActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, backgroundColor: APP_COLORS.bg, borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: APP_COLORS.border },
  primaryBtn: { backgroundColor: APP_COLORS.accentDim, borderColor: APP_COLORS.accent },
  actionBtnText: { fontSize: 14, color: APP_COLORS.text, fontWeight: '500' },
  primaryBtnText: { fontSize: 14, color: APP_COLORS.accent, fontWeight: '600' },
});

const set = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  panel: { backgroundColor: APP_COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%', borderWidth: 1, borderColor: APP_COLORS.border },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 18, fontWeight: '700', color: APP_COLORS.text, flex: 1 },
  closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 16, color: APP_COLORS.muted },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: APP_COLORS.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  themeOption: { alignItems: 'center', gap: 4, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: APP_COLORS.border, width: 72 },
  themeActive: { borderColor: APP_COLORS.accent, backgroundColor: APP_COLORS.accentDim },
  themePreview: { width: 40, height: 40, borderRadius: 4, overflow: 'hidden' },
  themePreviewDark: { position: 'absolute', bottom: 0, right: 0, width: 20, height: 20 },
  themeLabel: { fontSize: 11, color: APP_COLORS.muted },
  tcGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tcChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: APP_COLORS.border, alignItems: 'center' },
  tcActive: { borderColor: APP_COLORS.accent, backgroundColor: APP_COLORS.accentDim },
  tcText: { fontSize: 13, color: APP_COLORS.text, fontWeight: '500' },
  tcActiveText: { color: APP_COLORS.accent },
  tcCategory: { fontSize: 9, color: APP_COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: APP_COLORS.border },
  toggleLabel: { flex: 1, fontSize: 14, color: APP_COLORS.text },
  toggle: { width: 44, height: 24, borderRadius: 12, backgroundColor: APP_COLORS.border, padding: 2 },
  toggleOn: { backgroundColor: APP_COLORS.accent },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#888' },
  toggleThumbOn: { backgroundColor: '#1a1a1a', transform: [{ translateX: 20 }] },
});
