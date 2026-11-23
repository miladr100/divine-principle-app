import React, { useMemo } from 'react';
import { ImageBackground, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { Card } from '../components/Card';
import { reflectionForDate } from '../data/dailyReflections';
import { usePalette } from '../theme/palette';
import { useSettingsStore } from '../state/useSettingsStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function greeting(date: Date) {
  const hour = date.getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const colors = usePalette();
  const likedDays = useSettingsStore((state) => state.likedDays ?? []);
  const toggleLikedDay = useSettingsStore((state) => state.toggleLikedDay);
  const reflection = useMemo(() => reflectionForDate(), []);
  const liked = likedDays.includes(reflection.dia);

  const openBook = () => {
    if (reflection.sectionId) navigation.navigate('Reader', { sectionId: reflection.sectionId });
    else navigation.navigate('Tabs', { screen: 'Índice' });
  };

  const shareWord = () => {
    Share.share({
      message: `“${reflection.trecho}”\n\n${reflection.reflexao}`
    }).catch(() => undefined);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.greeting, { color: colors.text }]}>{greeting(new Date())}</Text>
      <ImageBackground source={require('../assets/word-of-day-sky.jpg')} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.scrim}>
          <Text style={styles.quote}>“{reflection.trecho}”</Text>
          <Text style={styles.reflection}>{reflection.reflexao}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.action} onPress={() => toggleLikedDay(reflection.dia)} accessibilityLabel={liked ? 'Desfazer curtida' : 'Curtir'}>
              <Text style={[styles.actionIcon, liked && styles.actionIconOn]}>{liked ? '♥' : '♡'}</Text>
              <Text style={styles.actionLabel}>{liked ? 'Curtido' : 'Curtir'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={shareWord} accessibilityLabel="Compartilhar">
              <Text style={styles.actionIcon}>↗</Text>
              <Text style={styles.actionLabel}>Enviar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.action} onPress={openBook} accessibilityLabel="Abrir no livro">
              <Text style={styles.actionIcon}>▤</Text>
              <Text style={styles.actionLabel}>Livro</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Continuar</Text>
      <TouchableOpacity onPress={() => navigation.navigate('Reader', { sectionId: 'part1-ch1-1-1' })}>
        <Card>
          <Text style={[styles.cardTitle, { color: colors.accent }]}>O Princípio da Criação</Text>
          <Text style={[styles.body, { color: colors.muted }]}>1.1 · As Características Duais de Deus</Text>
          <Text style={[styles.progress, { color: colors.muted }]}>Progresso do livro: 0%</Text>
        </Card>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 28 },
  greeting: { fontSize: 32, fontWeight: '700', marginTop: 8, marginBottom: 18 },
  hero: { borderRadius: 28, overflow: 'hidden', minHeight: 420 },
  heroImage: { borderRadius: 28 },
  scrim: { flex: 1, paddingTop: 28, paddingHorizontal: 22, backgroundColor: 'rgba(16, 28, 40, 0.12)' },
  quote: { color: '#fff', fontSize: 26, lineHeight: 36, fontWeight: '600', textShadowColor: 'rgba(12, 24, 36, 0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  reflection: { color: 'rgba(255,255,255,0.94)', fontSize: 16, lineHeight: 24, marginTop: 16, textShadowColor: 'rgba(12, 24, 36, 0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 28, marginHorizontal: -22, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 14 },
  action: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  actionIcon: { color: '#fff', fontSize: 26, fontWeight: '600' },
  actionIconOn: { color: '#ff8ea8' },
  actionLabel: { color: '#fff', fontSize: 12, marginTop: 4, fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: '700', marginVertical: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  body: { fontSize: 16, lineHeight: 24 },
  progress: { marginTop: 14 }
});
