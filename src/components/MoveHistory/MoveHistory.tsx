// ============================================================
// components/MoveHistory/MoveHistory.tsx
// ============================================================

import React, { useRef, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { HistoryEntry } from '../../types/chess.types';
import { APP_COLORS } from '../../theme';

interface MoveHistoryProps {
  history: HistoryEntry[];
  currentMoveIndex: number;
  onNavigate: (index: number) => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  history, currentMoveIndex, onNavigate
}) => {
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to latest move
  useEffect(() => {
    if (currentMoveIndex >= history.length - 1) {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [history.length, currentMoveIndex]);

  const movePairs = useCallback(() => {
    const pairs: Array<{
      num: number;
      white?: HistoryEntry;
      whiteIdx: number;
      black?: HistoryEntry;
      blackIdx: number;
    }> = [];

    for (let i = 0; i < history.length; i += 2) {
      pairs.push({
        num: Math.floor(i / 2) + 1,
        white: history[i],
        whiteIdx: i,
        black: history[i + 1],
        blackIdx: i + 1,
      });
    }
    return pairs;
  }, [history]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Move History</Text>
      <ScrollView ref={scrollRef} style={styles.scroll} showsVerticalScrollIndicator={false}>
        {movePairs().map(pair => (
          <View key={pair.num} style={styles.moveRow}>
            <Text style={styles.moveNum}>{pair.num}.</Text>

            {pair.white && (
              <Pressable
                style={[styles.moveBubble, pair.whiteIdx === currentMoveIndex && styles.activeBubble]}
                onPress={() => onNavigate(pair.whiteIdx)}
              >
                <Text style={[
                  styles.moveText,
                  pair.whiteIdx === currentMoveIndex && styles.activeMoveText
                ]}>
                  {pair.white.san}
                </Text>
              </Pressable>
            )}

            {pair.black ? (
              <Pressable
                style={[styles.moveBubble, pair.blackIdx === currentMoveIndex && styles.activeBubble]}
                onPress={() => onNavigate(pair.blackIdx)}
              >
                <Text style={[
                  styles.moveText,
                  pair.blackIdx === currentMoveIndex && styles.activeMoveText
                ]}>
                  {pair.black.san}
                </Text>
              </Pressable>
            ) : (
              <View style={[styles.moveBubble, { opacity: 0 }]} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: APP_COLORS.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    padding: 12,
    flex: 1,
    maxHeight: 220,
  },
  header: {
    fontSize: 10,
    fontWeight: '600',
    color: APP_COLORS.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  scroll: {
    flex: 1,
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 4,
  },
  moveNum: {
    fontSize: 11,
    color: APP_COLORS.muted,
    fontFamily: 'Courier',
    width: 24,
  },
  moveBubble: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  activeBubble: {
    backgroundColor: 'rgba(232, 201, 122, 0.18)',
  },
  moveText: {
    fontSize: 13,
    color: APP_COLORS.text,
    fontFamily: 'Courier',
  },
  activeMoveText: {
    color: APP_COLORS.accent,
    fontWeight: '600',
  },
});
