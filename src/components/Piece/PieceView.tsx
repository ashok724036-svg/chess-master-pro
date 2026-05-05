import React from 'react';
import { Text, StyleSheet, View } from 'react-native';

interface PieceViewProps {
  char: string;
  size: number;
}

export const PieceView: React.FC<PieceViewProps> = React.memo(({ char, size }) => {
  const fontSize = size * 0.72;
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Text
        style={[styles.piece, { fontSize, lineHeight: size }]}
        allowFontScaling={false}
      >
        {char}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  piece: {
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
