// ============================================================
// HomeScreen.tsx — Main Menu (Phone UI)
// Large touch targets, scrollable, mobile-first design
// ============================================================
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable,
  SafeAreaView, StatusBar, ScrollView,
} from 'react-native';
import { APP_COLORS } from '../theme';
import { Difficulty } from '../components/BotGame/BotGame';
import { Color } from '../types/chess.types';

interface HomeScreenProps {
  onStartVsBot: (difficulty: Difficulty, color: Color) => void;
  onStartVsHuman: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartVsBot, onStartVsHuman }) => {
  const [diff, setDiff] = useState<Difficulty>('medium');
  const [color, setColor] = useState<'w'|'b'|'rand'>('rand');

  const DIFFS: { key: Difficulty; label: string; emoji: string; sub: string }[] = [
    { key:'easy',   label:'Aasaan',  emoji:'😊', sub:'Naye khiladi' },
    { key:'medium', label:'Madhyam', emoji:'🧠', sub:'Thoda muskil' },
    { key:'hard',   label:'Mushkil', emoji:'👹', sub:'Expert level' },
  ];

  const handleStart = () => {
    const c: Color = color === 'rand' ? (Math.random() < 0.5 ? 'w' : 'b') : color;
    onStartVsBot(diff, c);
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={APP_COLORS.bg} />
      <ScrollView contentContainerStyle={s.scroll}>

        <View style={s.hero}>
          <Text style={s.logo}>♛</Text>
          <Text style={s.title}>ChessMaster Pro</Text>
          <Text style={s.sub}>React Native + Expo</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>🤖 Bot se Khelo</Text>

          <Text style={s.lbl}>Difficulty Chuno</Text>
          <View style={s.row}>
            {DIFFS.map(d => (
              <Pressable key={d.key}
                style={[s.chip, diff === d.key && s.chipOn]}
                onPress={() => setDiff(d.key)}>
                <Text style={s.chipEmoji}>{d.emoji}</Text>
                <Text style={[s.chipTxt, diff === d.key && s.chipTxtOn]}>{d.label}</Text>
                <Text style={s.chipSub}>{d.sub}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.lbl}>Apna Color Chuno</Text>
          <View style={s.row}>
            {[{k:'w',e:'♔',l:'White'},{k:'rand',e:'🎲',l:'Random'},{k:'b',e:'♚',l:'Black'}].map(c => (
              <Pressable key={c.k}
                style={[s.chip, color === c.k && s.chipGreen]}
                onPress={() => setColor(c.k as any)}>
                <Text style={s.chipEmoji}>{c.e}</Text>
                <Text style={[s.chipTxt, color === c.k && {color:'#27ae60'}]}>{c.l}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={s.startBtn} onPress={handleStart}>
            <Text style={s.startTxt}>Khel Shuru Karo →</Text>
          </Pressable>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>👥 Dost ke Saath</Text>
          <Pressable style={s.modeRow} onPress={onStartVsHuman}>
            <View>
              <Text style={s.modeTitle}>2-Player (Same Phone)</Text>
              <Text style={s.modeSub}>Ek hi device par dono players</Text>
            </View>
            <Text style={s.arrow}>›</Text>
          </Pressable>
        </View>

        <View style={[s.card, {borderColor:'rgba(232,201,122,0.25)'}]}>
          <Text style={s.cardTitle}>📱 Kaise Khelen?</Text>
          {['Piece tap karo — green dots dikhenge jahan ja sakta hai',
            'Destination tap karo — move ho jayega',
            'Piece drag karo — seedha chhod do',
            'Hint button — best move highlight hoga',
            'Wapas button — aapka + bot ka dono move undo',
            'Screen ghuma lo — landscape mein bada board!',
          ].map((t,i) => (
            <Text key={i} style={s.tip}>• {t}</Text>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  safe:{ flex:1, backgroundColor:APP_COLORS.bg },
  scroll:{ padding:16, gap:14, paddingBottom:36 },
  hero:{ alignItems:'center', paddingVertical:28 },
  logo:{ fontSize:56, marginBottom:8 },
  title:{ fontSize:26, fontWeight:'700', color:APP_COLORS.accent },
  sub:{ fontSize:11, color:APP_COLORS.muted, marginTop:4, textTransform:'uppercase', letterSpacing:1 },
  card:{ backgroundColor:APP_COLORS.card, borderRadius:14, padding:16, borderWidth:0.5, borderColor:APP_COLORS.border, gap:0 },
  cardTitle:{ fontSize:16, fontWeight:'600', color:APP_COLORS.text, marginBottom:14 },
  lbl:{ fontSize:11, color:APP_COLORS.muted, fontWeight:'600', textTransform:'uppercase', letterSpacing:1, marginBottom:8 },
  row:{ flexDirection:'row', gap:8, marginBottom:16 },
  chip:{ flex:1, backgroundColor:APP_COLORS.bg, borderRadius:10, padding:10, alignItems:'center', borderWidth:0.5, borderColor:APP_COLORS.border },
  chipOn:{ borderColor:APP_COLORS.accent, backgroundColor:'rgba(232,201,122,0.1)' },
  chipGreen:{ borderColor:'#27ae60', backgroundColor:'rgba(39,174,96,0.08)' },
  chipEmoji:{ fontSize:22, marginBottom:4 },
  chipTxt:{ fontSize:12, fontWeight:'500', color:APP_COLORS.muted },
  chipTxtOn:{ color:APP_COLORS.accent },
  chipSub:{ fontSize:10, color:APP_COLORS.muted, textAlign:'center', marginTop:2 },
  startBtn:{ backgroundColor:APP_COLORS.accent, borderRadius:12, padding:14, alignItems:'center', marginTop:4 },
  startTxt:{ fontSize:16, fontWeight:'700', color:'#1a1a1a' },
  modeRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:12, backgroundColor:APP_COLORS.bg, borderRadius:10, borderWidth:0.5, borderColor:APP_COLORS.border },
  modeTitle:{ fontSize:14, fontWeight:'500', color:APP_COLORS.text, marginBottom:3 },
  modeSub:{ fontSize:12, color:APP_COLORS.muted },
  arrow:{ fontSize:22, color:APP_COLORS.muted },
  tip:{ fontSize:13, color:APP_COLORS.muted, marginBottom:5, lineHeight:19 },
});
