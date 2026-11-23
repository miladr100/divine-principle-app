import React from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Appearance, ReadingDepth, useSettingsStore } from '../state/useSettingsStore';
import { usePalette } from '../theme/palette';

export function SettingsScreen() {
  const s = useSettingsStore();
  const colors = usePalette();
  const depths: { key: ReadingDepth; label: string }[] = [
    { key: 'red', label: 'Somente vermelho' },
    { key: 'blue', label: 'Vermelho + azul' },
    { key: 'yellow', label: 'Vermelho + azul + amarelo' },
    { key: 'full', label: 'Texto integral' }
  ];
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.heading, { color: colors.accent }]}>Aparência</Text>
      <View style={styles.wrap}>
        {([
          ['light', 'Claro'],
          ['blue', 'Azul'],
          ['dark', 'Escuro']
        ] as [Appearance, string][]).map(([key, label]) => (
          <TouchableOpacity key={key} style={[styles.pill, { borderColor: colors.border }, s.appearance === key && { backgroundColor: colors.surface }]} onPress={() => s.setAppearance(key)}>
            <Text style={[styles.pillText, { color: colors.text }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.heading, { color: colors.accent }]}>Leitura</Text>
      <View style={[styles.row, { borderBottomColor: colors.line }]}>
        <Text style={[styles.label, { color: colors.text }]}>Mostrar cores originais</Text>
        <Switch value={s.showEditorialColors} onValueChange={s.setShowEditorialColors} />
      </View>
      <Text style={[styles.sub, { color: colors.muted }]}>Princípio resumido em cores</Text>
      {depths.map((d) => (
        <TouchableOpacity key={d.key} style={styles.option} onPress={() => s.setReadingDepth(d.key)}>
          <Text style={[styles.label, { color: colors.text }]}>{d.label}</Text>
          <Text style={[styles.check, { color: colors.link }]}>{s.readingDepth === d.key ? '●' : '○'}</Text>
        </TouchableOpacity>
      ))}
      <Text style={[styles.sub, { color: colors.muted }]}>Tamanho da fonte</Text>
      <View style={[styles.stepper, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => s.setFontSize(Math.max(14, s.fontSize - 1))}><Text style={[styles.step, { color: colors.link }]}>A−</Text></TouchableOpacity>
        <Text style={[styles.value, { color: colors.text }]}>{s.fontSize}px</Text>
        <TouchableOpacity onPress={() => s.setFontSize(Math.min(30, s.fontSize + 1))}><Text style={[styles.step, { color: colors.link }]}>A+</Text></TouchableOpacity>
      </View>
      <Text style={[styles.heading, { color: colors.accent }]}>Áudio</Text>
      <View style={[styles.row, { borderBottomColor: colors.line }]}>
        <Text style={[styles.label, { color: colors.text }]}>Continuar para próxima seção</Text>
        <Switch value={s.autoContinueSection} onValueChange={s.setAutoContinueSection} />
      </View>
      <Text style={[styles.sub, { color: colors.muted }]}>Velocidade</Text>
      <View style={styles.wrap}>
        {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
          <TouchableOpacity key={rate} style={[styles.pill, { borderColor: colors.border }, s.speechRate === rate && { backgroundColor: colors.surface }]} onPress={() => s.setSpeechRate(rate)}>
            <Text style={[styles.pillText, { color: colors.text }]}>{rate}x</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 18 },
  heading: { fontSize: 21, fontWeight: '800', marginTop: 12, marginBottom: 10 },
  sub: { marginTop: 18, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  label: { fontSize: 16, flex: 1 },
  option: { flexDirection: 'row', paddingVertical: 12 },
  check: { fontSize: 20 },
  stepper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, padding: 12 },
  step: { fontWeight: '800', fontSize: 18 },
  value: {},
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, marginRight: 8, marginBottom: 8 },
  pillText: {}
});
