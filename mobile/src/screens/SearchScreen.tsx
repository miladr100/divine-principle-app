import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { searchBook } from '../services/bookService';
import { usePalette } from '../theme/palette';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function SearchScreen() {
  const [q, setQ] = useState('');
  const nav = useNavigation<Nav>();
  const results = useMemo(() => searchBook(q), [q]);
  const colors = usePalette();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <TextInput value={q} onChangeText={setQ} placeholder="Pesquisar no Princípio Divino" placeholderTextColor={colors.muted} style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]} />
      <FlatList
        data={results}
        keyExtractor={(item) => item.paragraph.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.item, { borderBottomColor: colors.line }]} onPress={() => nav.navigate('Reader', { sectionId: item.node.id })}>
            <Text style={[styles.title, { color: colors.accent }]}>{item.title}</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>{item.meta}</Text>
            <Text style={[styles.body, { color: colors.text }]} numberOfLines={3}>{item.paragraph.text}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#031f2b', padding: 14 },
  input: { backgroundColor: '#073040', borderRadius: 14, padding: 14, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#164657' },
  item: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#113b49' },
  title: { color: '#76dcff', fontWeight: '700', fontSize: 16 },
  meta: { color: '#7fa6b5', marginVertical: 5 },
  body: { color: '#d9edf5', lineHeight: 21 }
});
