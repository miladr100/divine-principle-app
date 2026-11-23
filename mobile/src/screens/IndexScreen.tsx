import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { BOOK_ROOTS, getPreviousReadableSibling, nodeLabel } from '../data/bookCatalog';
import { BookNode } from '../types/book';
import { RootStackParamList } from '../navigation/types';
import { usePalette } from '../theme/palette';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function IndexScreen() {
  const navigation = useNavigation<Nav>();
  const colors = usePalette();
  const [open, setOpen] = useState<Record<string, boolean>>({ part1: true, 'part1-ch1': true });

  const toggle = (id: string) => setOpen((current) => ({ ...current, [id]: !current[id] }));

  const openReader = (node: BookNode) => {
    const previous = getPreviousReadableSibling(node.id);
    navigation.navigate('Reader', { sectionId: node.id, previousSectionId: previous?.id });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.content}>
      <Text style={[styles.intro, { color: colors.muted }]}>Navegue pela estrutura do livro. Cada seção abre o texto correspondente e pode ser ouvida.</Text>
      {BOOK_ROOTS.map((node) => (
        <IndexNode key={node.id} node={node} depth={0} open={open} onToggle={toggle} onOpen={openReader} />
      ))}
    </ScrollView>
  );
}

function IndexNode({
  node,
  depth,
  open,
  onToggle,
  onOpen
}: {
  node: BookNode;
  depth: number;
  open: Record<string, boolean>;
  onToggle: (id: string) => void;
  onOpen: (node: BookNode) => void;
}) {
  const hasChildren = node.children.length > 0;
  const canRead = node.paragraphs.length > 0;
  const expanded = !!open[node.id];
  const colors = usePalette();

  const onPress = () => {
    if (hasChildren) onToggle(node.id);
    else if (canRead) onOpen(node);
  };

  return (
    <View style={depth === 0 ? [styles.block, { borderColor: colors.border }] : undefined}>
      <TouchableOpacity
        onPress={onPress}
        disabled={!hasChildren && !canRead}
        style={[rowStyle(depth), depthStyle(depth, colors), !hasChildren && !canRead && styles.disabledRow]}
      >
        <Text style={[textStyle(depth), labelColor(depth, colors)]}>{nodeLabel(node)}</Text>
        {hasChildren ? <Text style={[styles.arrow, { color: colors.muted }]}>{expanded ? '⌄' : '›'}</Text> : null}
      </TouchableOpacity>
      {expanded && canRead ? (
        <TouchableOpacity style={[styles.readRow, { backgroundColor: colors.read }]} onPress={() => onOpen(node)}>
          <Text style={[styles.readText, { color: colors.link }]}>Ler o texto</Text>
        </TouchableOpacity>
      ) : null}
      {expanded && node.children.map((child) => (
        <IndexNode key={child.id} node={child} depth={depth + 1} open={open} onToggle={onToggle} onOpen={onOpen} />
      ))}
    </View>
  );
}

function rowStyle(depth: number) {
  if (depth === 0) return styles.row;
  if (depth === 1) return styles.chapterRow;
  if (depth === 2) return styles.sectionRow;
  return styles.subsectionRow;
}

function depthStyle(depth: number, colors: ReturnType<typeof usePalette>) {
  if (depth === 0) return { backgroundColor: colors.surface };
  if (depth === 1) return { borderTopColor: colors.border };
  if (depth === 2) return { backgroundColor: colors.surfaceAlt };
  return { backgroundColor: colors.surfaceDeep };
}

function labelColor(depth: number, colors: ReturnType<typeof usePalette>) {
  if (depth === 0) return { color: colors.accent };
  if (depth === 1) return { color: colors.text };
  if (depth === 2) return { color: colors.accent };
  return { color: colors.text };
}

function textStyle(depth: number) {
  if (depth === 0) return styles.part;
  if (depth === 1) return styles.chapter;
  if (depth === 2) return styles.section;
  return styles.subsection;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#031f2b' },
  content: { padding: 14, paddingBottom: 28 },
  intro: { color: '#9dc2cf', fontSize: 15, lineHeight: 22, margin: 8 },
  block: { borderWidth: 1, borderColor: '#164657', borderRadius: 18, overflow: 'hidden', marginTop: 12 },
  row: { padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#073040' },
  part: { color: '#76dcff', fontSize: 22, fontWeight: '700', flex: 1, paddingRight: 8 },
  chapterRow: { padding: 17, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#164657' },
  chapter: { color: '#dff5ff', fontSize: 16, flex: 1, paddingRight: 8 },
  sectionRow: { paddingVertical: 14, paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#052936' },
  section: { color: '#9ed6e8', fontSize: 15, flex: 1, paddingRight: 8 },
  subsectionRow: { paddingVertical: 12, paddingLeft: 34, paddingRight: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#042430' },
  subsection: { color: '#c5e7f2', fontSize: 14, flex: 1, paddingRight: 8, lineHeight: 20 },
  readRow: { paddingVertical: 12, paddingHorizontal: 22, backgroundColor: '#0a3a4c' },
  readText: { color: '#00c8ee', fontSize: 14, fontWeight: '700' },
  disabledRow: { opacity: 0.55 },
  arrow: { color: '#8fb4c1', fontSize: 22 }
});
