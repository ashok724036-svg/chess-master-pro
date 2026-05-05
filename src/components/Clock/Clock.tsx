// ============================================================
// components/Clock/Clock.tsx — Dual Chess Clock Component
// ============================================================

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { Color } from '../../types/chess.types';
import { formatTime, formatTimePrecise } from '../../utils/boardUtils';
import { APP_COLORS } from '../../theme';

interface ClockProps {
  whiteMs: number;
  blackMs: number;
  activeColor: Color | null;
  running: boolean;
  playerWhiteName?: string;
  playerBlackName?: string;
  flipped?: boolean;
}

interface SingleClockProps {
  timeMs: number;
  color: Color;
  isActive: boolean;
  playerName?: string;
}

const SingleClock: React.FC<SingleClockProps> = ({ timeMs, color, isActive, playerName }) => {
  const isLow = timeMs < 30_000; // Under 30 seconds
  const isCritical = timeMs < 10_000; // Under 10 seconds

  const displayTime = isCritical ? formatTimePrecise(timeMs) : formatTime(timeMs);

  const animStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(
      isActive
        ? (isCritical ? APP_COLORS.danger : APP_COLORS.accent)
        : APP_COLORS.card,
      { duration: 200 }
    ),
  }));

  const textColor = isActive ? (isCritical ? '#fff' : '#1a1a1a') : APP_COLORS.text;
  const mutedColor = isActive ? (isCritical ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)') : APP_COLORS.muted;

  return (
    <Animated.View style={[styles.clock, animStyle]}>
      <Text style={[styles.playerName, { color: mutedColor }]} numberOfLines={1}>
        {playerName || (color === 'w' ? 'White' : 'Black')}
      </Text>
      <Text style={[
        styles.timeDisplay,
        { color: textColor },
        isCritical && styles.criticalTime,
        isActive && styles.activeTime,
      ]}>
        {displayTime}
      </Text>
    </Animated.View>
  );
};

export const ChessClock: React.FC<ClockProps> = ({
  whiteMs,
  blackMs,
  activeColor,
  running,
  playerWhiteName,
  playerBlackName,
  flipped = false,
}) => {
  const topClock = flipped
    ? { ms: whiteMs, color: 'w' as Color, active: activeColor === 'w', name: playerWhiteName }
    : { ms: blackMs, color: 'b' as Color, active: activeColor === 'b', name: playerBlackName };

  const bottomClock = flipped
    ? { ms: blackMs, color: 'b' as Color, active: activeColor === 'b', name: playerBlackName }
    : { ms: whiteMs, color: 'w' as Color, active: activeColor === 'w', name: playerWhiteName };

  return (
    <View style={styles.container}>
      <SingleClock {...topClock} />
      <SingleClock {...bottomClock} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    gap: 8,
  },
  clock: {
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: APP_COLORS.border,
    minWidth: 100,
  },
  playerName: {
    fontSize: 11,
    fontFamily: 'System',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  timeDisplay: {
    fontSize: 28,
    fontFamily: 'Courier', // Use JetBrains Mono via expo-font in production
    fontWeight: '500',
    letterSpacing: 1,
    lineHeight: 34,
  },
  activeTime: {
    fontSize: 30,
  },
  criticalTime: {
    fontSize: 26,
    fontWeight: '700',
  },
});
