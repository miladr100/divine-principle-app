import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { RootStackParamList, TabParamList } from '../navigation/types';
import { buildReaderHtml } from '../services/readerHtml';
import { getNextSection, getPreviousReadableSection, getSection } from '../services/bookService';
import { nodeLabel } from '../data/bookCatalog';
import { visibleParagraphText } from '../services/editorialText';
import { addHighlight, addNote, markPreviousSectionCompleted, saveLastParagraph } from '../db/database';
import { useSettingsStore } from '../state/useSettingsStore';
import { usePalette } from '../theme/palette';

type R = RouteProp<RootStackParamList, 'Reader'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;
type Selection = { paragraphId: string; text: string; startOffset?: number; endOffset?: number };

const TABS: { screen: keyof TabParamList; label: string; icon: string }[] = [
  { screen: 'Início', label: 'Início', icon: '⌂' },
  { screen: 'Índice', label: 'Índice', icon: '☰' },
  { screen: 'Pesquisa', label: 'Pesquisa', icon: '⌕' },
  { screen: 'Meu Estudo', label: 'Estudo', icon: '✎' },
  { screen: 'Ajustes', label: 'Ajustes', icon: '⚙' }
];

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export function ReaderScreen() {
  const route = useRoute<R>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const section = getSection(route.params.sectionId);
  const settings = useSettingsStore();
  const colors = usePalette();
  const [playing, setPlaying] = useState(false);
  const [currentParagraph, setCurrentParagraph] = useState<string | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [bible, setBible] = useState<{ label: string; text: string } | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [audioOpen, setAudioOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [pageQuery, setPageQuery] = useState('');
  const [findIndex, setFindIndex] = useState(0);
  const [findCount, setFindCount] = useState(0);
  const [chromeVisible, setChromeVisible] = useState(true);
  const [chromeHeight, setChromeHeight] = useState(150);
  const chromeY = useRef(new Animated.Value(0)).current;
  const speechSession = useRef(0);
  const playingRef = useRef(false);

  useEffect(() => {
    if (route.params.previousSectionId) markPreviousSectionCompleted(route.params.previousSectionId).catch(console.error);
    return () => {
      speechSession.current += 1;
      Speech.stop();
    };
  }, [route.params.previousSectionId]);

  useEffect(() => {
    setSearchOpen(false);
    setPageQuery('');
    setFindIndex(0);
    setFindCount(0);
  }, [route.params.sectionId]);

  useEffect(() => {
    Animated.timing(chromeY, {
      toValue: chromeVisible ? 0 : chromeHeight + 24,
      duration: 220,
      useNativeDriver: true
    }).start();
  }, [chromeVisible, chromeHeight, chromeY]);

  const html = useMemo(() => section ? buildReaderHtml({
    section,
    fontSize: settings.fontSize,
    showEditorialColors: settings.showEditorialColors,
    readingDepth: settings.readingDepth,
    darkMode: settings.darkMode
  }) : '', [section, settings.fontSize, settings.showEditorialColors, settings.readingDepth, settings.darkMode]);

  useEffect(() => {
    const px = Math.round(32 * settings.scrollSpeed);
    webRef.current?.injectJavaScript(`window.__setAutoScroll && window.__setAutoScroll(${settings.autoScroll}, ${px}); true;`);
  }, [settings.autoScroll, settings.scrollSpeed, html]);

  useEffect(() => {
    const script = !searchOpen || pageQuery.trim().length < 2
      ? 'window.__clearFind && window.__clearFind(); true;'
      : `window.__find && window.__find(${JSON.stringify(pageQuery)}, ${findIndex}); true;`;
    webRef.current?.injectJavaScript(script);
  }, [searchOpen, pageQuery, findIndex, html]);

  const spokenParagraphs = useMemo(() => (section?.paragraphs ?? [])
    .map((paragraph) => ({ paragraph, text: visibleParagraphText(paragraph, settings.readingDepth) }))
    .filter((item) => item.text.length > 0), [section, settings.readingDepth]);

  if (!section) return <View style={[styles.center, { backgroundColor: colors.bg }]}><Text style={{ color: colors.text }}>Seção não encontrada.</Text></View>;
  if (!section.paragraphs.length) return <View style={[styles.center, { backgroundColor: colors.bg }]}><Text style={{ color: colors.text }}>Este item do índice não tem texto extraído.</Text></View>;

  const markPlaying = (value: boolean) => {
    playingRef.current = value;
    setPlaying(value);
  };

  const clearSpeaking = () => {
    webRef.current?.injectJavaScript(`window.__setSpeaking && window.__setSpeaking(''); true;`);
  };

  const speakFrom = (paragraphId: string) => {
    const session = ++speechSession.current;
    markPlaying(true);
    const start = spokenParagraphs.findIndex((item) => item.paragraph.id === paragraphId);
    if (start < 0) {
      markPlaying(false);
      clearSpeaking();
      Speech.stop();
      return;
    }

    const speakIndex = (index: number) => {
      if (session !== speechSession.current) return;
      if (index >= spokenParagraphs.length) {
        markPlaying(false);
        clearSpeaking();
        if (settings.autoContinueSection) {
          const next = getNextSection(section.id);
          if (next) navigation.replace('Reader', { sectionId: next.id, previousSectionId: section.id });
        }
        return;
      }
      const item = spokenParagraphs[index];
      setCurrentParagraph(item.paragraph.id);
      saveLastParagraph(section.id, item.paragraph.id).catch(console.error);
      webRef.current?.injectJavaScript(`window.__setSpeaking('${item.paragraph.id}'); true;`);
      let continued = false;
      Speech.speak(item.text, {
        language: 'pt-BR',
        rate: settings.speechRate,
        onDone: () => {
          if (session !== speechSession.current || continued) return;
          continued = true;
          speakIndex(index + 1);
        },
        onStopped: () => {
          if (session !== speechSession.current || continued) return;
          markPlaying(false);
          clearSpeaking();
        },
        onError: () => {
          if (session !== speechSession.current) return;
          markPlaying(false);
          clearSpeaking();
        }
      });
    };

    setCurrentParagraph(paragraphId);
    Speech.stop().then(() => {
      if (session !== speechSession.current) return;
      speakIndex(start);
    }).catch(() => {
      if (session !== speechSession.current) return;
      speakIndex(start);
    });
  };

  const pause = () => {
    speechSession.current += 1;
    markPlaying(false);
    clearSpeaking();
    Speech.stop();
  };

  const togglePlayback = () => {
    if (playingRef.current) {
      pause();
      return;
    }
    speakFrom(currentParagraph ?? spokenParagraphs[0]?.paragraph.id);
  };

  const openTab = (screen: keyof TabParamList) => {
    pause();
    navigation.navigate('Tabs', { screen });
  };

  const goToSection = (sectionId: string, markCurrentRead: boolean) => {
    pause();
    navigation.replace('Reader', {
      sectionId,
      previousSectionId: markCurrentRead ? section.id : undefined
    });
  };

  const previous = getPreviousReadableSection(section.id);
  const next = getNextSection(section.id);

  const handleSelection = (selected: Selection) => {
    Alert.alert('Estudar trecho', selected.text, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Destacar', onPress: async () => {
        await addHighlight({ id: `hl-${Date.now()}`, sectionId: section.id, paragraphId: selected.paragraphId, selectedText: selected.text, startOffset: selected.startOffset, endOffset: selected.endOffset });
        Alert.alert('Salvo', 'Trecho destacado em rosa.');
      } },
      { text: 'Nota', onPress: () => setNoteOpen(true) },
      { text: 'Compartilhar', onPress: () => Share.share({ message: `“${selected.text}”\n— Princípio Divino` }) }
    ]);
  };

  const ink = { color: colors.text };
  return <View style={[styles.container, { backgroundColor: colors.bg }]}>
    <View style={[styles.topBar, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} accessibilityLabel="Voltar">
        <Text style={[styles.icon, ink]}>‹</Text>
      </TouchableOpacity>
      {searchOpen ? null : <View style={styles.topSpacer} />}
      {searchOpen ? null : (
        <TouchableOpacity style={styles.iconButton} onPress={() => setAudioOpen(true)} accessibilityLabel="Opções de áudio">
          <Text style={[styles.icon, ink]}>♫</Text>
        </TouchableOpacity>
      )}
      {searchOpen ? (
        <View style={styles.pageSearch}>
          <TextInput
            value={pageQuery}
            onChangeText={(value) => { setPageQuery(value); setFindIndex(0); }}
            placeholder="Buscar nesta seção"
            placeholderTextColor={colors.muted}
            style={[styles.pageSearchInput, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
            autoFocus
            returnKeyType="search"
          />
          <Text style={[styles.findCount, { color: colors.muted }]}>{pageQuery.trim().length < 2 ? '' : `${findCount ? (findIndex % findCount) + 1 : 0}/${findCount}`}</Text>
          <TouchableOpacity style={styles.findStep} disabled={!findCount} onPress={() => setFindIndex((index) => (index - 1 + findCount) % findCount)}>
            <Text style={[styles.findStepIcon, ink, !findCount && styles.disabled]}>⌃</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.findStep} disabled={!findCount} onPress={() => setFindIndex((index) => (index + 1) % findCount)}>
            <Text style={[styles.findStepIcon, ink, !findCount && styles.disabled]}>⌄</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={() => { setSearchOpen(false); setPageQuery(''); }} accessibilityLabel="Fechar busca">
            <Text style={[styles.icon, ink]}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.iconButton} onPress={() => { setChromeVisible(true); setSearchOpen(true); }} accessibilityLabel="Buscar nesta seção">
          <Text style={[styles.icon, ink]}>⌕</Text>
        </TouchableOpacity>
      )}
    </View>

    <WebView
      ref={webRef}
      originWhitelist={['*']}
      source={{ html }}
      onLoadEnd={() => {
        const { autoScroll, scrollSpeed } = useSettingsStore.getState();
        const px = Math.round(32 * scrollSpeed);
        webRef.current?.injectJavaScript(`window.__setAutoScroll && window.__setAutoScroll(${autoScroll}, ${px}); true;`);
      }}
      style={[styles.web, { backgroundColor: colors.bg }]}
      onMessage={(event) => {
        try {
          const msg = JSON.parse(event.nativeEvent.data);
          if (msg.type === 'paragraphTap') speakFrom(msg.paragraphId);
          if (msg.type === 'selection') { setSelection(msg); setTimeout(() => handleSelection(msg), 0); }
          if (msg.type === 'bibleRef') setBible({ label: msg.label, text: msg.text });
          if (msg.type === 'footnote') {
            const passage = /\d+\s*:\s*\d+/.test(msg.text ?? '');
            setBible({ label: `${passage ? 'Passagem' : 'Nota'} ${msg.number}`, text: msg.text });
          }
          if (msg.type === 'find') {
            setFindCount(msg.count ?? 0);
            return;
          }
          if (msg.type === 'scroll') {
            setChromeVisible((visible) => {
              if (msg.direction === 'down' && msg.y > 64) return false;
              if (msg.direction === 'up') return true;
              return visible;
            });
          }
          if (msg.type === 'autoScrollPaused') settings.setAutoScroll(false);
          if (msg.type === 'autoScrollEnd') {
            if (settings.scrollAtEnd === 'next' && next) {
              goToSection(next.id, true);
              return;
            }
            settings.setAutoScroll(false);
          }
        } catch { /* ignore malformed webview messages */ }
      }}
    />

    <Animated.View
      style={[styles.bottomChrome, { paddingBottom: Math.max(insets.bottom, 8), transform: [{ translateY: chromeY }], backgroundColor: colors.chrome, borderTopColor: colors.line }]}
      onLayout={(event) => setChromeHeight(event.nativeEvent.layout.height)}
    >
      <View style={styles.transport}>
        <TouchableOpacity style={[styles.playCircle, { backgroundColor: colors.read }]} onPress={togglePlayback} accessibilityLabel={playing ? 'Pausar' : 'Ouvir'}>
          <Text style={[styles.playGlyph, ink]}>{playing ? '❚❚' : '▶'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.step} disabled={!previous} onPress={() => previous && goToSection(previous.id, false)} accessibilityLabel="Seção anterior">
          <Text style={[styles.stepIcon, ink, !previous && styles.disabled]}>‹</Text>
        </TouchableOpacity>
        <View style={[styles.locationPill, { backgroundColor: colors.surface }]}>
          <Text style={[styles.location, ink]} numberOfLines={1} ellipsizeMode="tail">{nodeLabel(section)}</Text>
        </View>
        <TouchableOpacity style={styles.step} disabled={!next} onPress={() => next && goToSection(next.id, true)} accessibilityLabel="Próxima seção">
          <Text style={[styles.stepIcon, ink, !next && styles.disabled]}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab.screen} style={styles.tab} onPress={() => openTab(tab.screen)}>
            <Text style={[styles.tabIcon, { color: colors.muted }]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, { color: colors.muted }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>

    <Modal visible={audioOpen} transparent animationType="slide" onRequestClose={() => setAudioOpen(false)}>
      <Pressable style={styles.sheetOverlay} onPress={() => setAudioOpen(false)}>
        <Pressable style={[styles.audioSheet, { backgroundColor: colors.surface, borderColor: colors.border, maxHeight: '82%' }]} onPress={() => undefined}>
          <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={[styles.modalTitle, { color: colors.accent }]}>Áudio</Text>
          <View style={styles.audioActions}>
            <TouchableOpacity style={[styles.audioAction, { backgroundColor: colors.read }]} onPress={() => { setAudioOpen(false); togglePlayback(); }}>
              <Text style={[styles.audioActionText, ink]}>{playing ? 'Pausar' : 'Ouvir'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.audioAction, { backgroundColor: colors.read }]} onPress={() => pause()}>
              <Text style={[styles.audioActionText, ink]}>Parar</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.speedLabel, { color: colors.muted }]}>Rolagem automática</Text>
          <TouchableOpacity
            style={[styles.audioAction, { backgroundColor: colors.read, marginBottom: 8 }]}
            onPress={() => {
              const nextValue = !settings.autoScroll;
              settings.setAutoScroll(nextValue);
              if (nextValue) setAudioOpen(false);
            }}
          >
            <Text style={[styles.audioActionText, ink]}>{settings.autoScroll ? 'Parar rolagem' : 'Iniciar rolagem'}</Text>
          </TouchableOpacity>
          <Text style={[styles.speedLabel, { color: colors.muted }]}>Velocidade da rolagem</Text>
          <View style={styles.speedRow}>
            <TouchableOpacity style={[styles.speedPill, { borderColor: colors.border }]} onPress={() => settings.setScrollSpeed(Math.round(Math.min(3, Math.max(0.5, settings.scrollSpeed - 0.25)) * 100) / 100)}>
              <Text style={[styles.speedText, ink]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.scrollValue, ink]}>{Number(settings.scrollSpeed.toFixed(2))}x</Text>
            <TouchableOpacity style={[styles.speedPill, { borderColor: colors.border }]} onPress={() => settings.setScrollSpeed(Math.round(Math.min(3, Math.max(0.5, settings.scrollSpeed + 0.25)) * 100) / 100)}>
              <Text style={[styles.speedText, ink]}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.speedLabel, { color: colors.muted }]}>No fim da página</Text>
          <View style={styles.speedRow}>
            <TouchableOpacity style={[styles.speedPill, { borderColor: colors.border }, settings.scrollAtEnd === 'stop' && { backgroundColor: colors.read }]} onPress={() => settings.setScrollAtEnd('stop')}>
              <Text style={[styles.speedText, ink]}>Parar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.speedPill, { borderColor: colors.border }, settings.scrollAtEnd === 'next' && { backgroundColor: colors.read }]} onPress={() => settings.setScrollAtEnd('next')}>
              <Text style={[styles.speedText, ink]}>Próxima página</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.speedLabel, { color: colors.muted }]}>Velocidade do áudio</Text>
          <View style={styles.speedRow}>
            {SPEEDS.map((rate) => (
              <TouchableOpacity key={rate} style={[styles.speedPill, { borderColor: colors.border }, settings.speechRate === rate && { backgroundColor: colors.read }]} onPress={() => settings.setSpeechRate(rate)}>
                <Text style={[styles.speedText, ink]}>{rate}x</Text>
              </TouchableOpacity>
            ))}
          </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>

    <Modal visible={!!bible} transparent animationType="fade" onRequestClose={() => setBible(null)}>
      <Pressable style={styles.overlay} onPress={() => setBible(null)}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.accent }]}>{bible?.label}</Text>
          <Text style={[styles.modalText, ink]}>{bible?.text}</Text>
          <Text style={[styles.close, { color: colors.link }]}>Fechar</Text>
        </View>
      </Pressable>
    </Modal>

    <Modal visible={noteOpen} transparent animationType="slide" onRequestClose={() => setNoteOpen(false)}>
      <View style={styles.overlay}><View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.modalTitle, { color: colors.accent }]}>Adicionar nota</Text>
        <TextInput value={noteText} onChangeText={setNoteText} multiline placeholder="Escreva sua reflexão..." placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.border }]} />
        <TouchableOpacity style={styles.save} onPress={async () => {
          if (!selection || !noteText.trim()) return;
          await addNote({ id: `note-${Date.now()}`, sectionId: section.id, paragraphId: selection.paragraphId, selectedText: selection.text, noteText: noteText.trim() });
          setNoteText('');
          setNoteOpen(false);
        }}><Text style={styles.saveText}>Salvar nota</Text></TouchableOpacity>
      </View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#031f2b' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#031f2b' },
  white: { color: '#fff' },
  web: { flex: 1, backgroundColor: '#031f2b' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6, backgroundColor: '#031f2b' },
  topSpacer: { flex: 1 },
  pageSearch: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 4 },
  pageSearchInput: { flex: 1, backgroundColor: '#073040', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#164657' },
  findCount: { color: '#9ed6e8', minWidth: 42, textAlign: 'center', fontSize: 13 },
  findStep: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  findStepIcon: { color: '#eaf8ff', fontSize: 18, fontWeight: '700' },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  icon: { color: '#eaf8ff', fontSize: 26, fontWeight: '500' },
  bottomChrome: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#021820', borderTopWidth: 1, borderTopColor: '#113b49' },
  transport: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8 },
  playCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#0b4658', alignItems: 'center', justifyContent: 'center' },
  playGlyph: { color: '#eaf8ff', fontSize: 18, fontWeight: '700' },
  step: { width: 40, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepIcon: { color: '#dff5ff', fontSize: 30, fontWeight: '500' },
  disabled: { color: '#3d6270' },
  locationPill: { flex: 1, minWidth: 0, backgroundColor: '#0b3040', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 4, justifyContent: 'center' },
  location: { color: '#eaf8ff', fontSize: 14, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
  tabRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#113b49', paddingTop: 6 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabIcon: { color: '#9ed6e8', fontSize: 18 },
  tabLabel: { color: '#9ed6e8', fontSize: 11, marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.62)', justifyContent: 'center', padding: 24 },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.62)', justifyContent: 'flex-end' },
  audioSheet: { backgroundColor: '#073040', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, paddingBottom: 32, borderColor: '#164657', borderWidth: 1 },
  modalCard: { backgroundColor: '#073040', borderRadius: 20, padding: 22, borderColor: '#164657', borderWidth: 1 },
  modalTitle: { color: '#76dcff', fontSize: 22, fontWeight: '700', marginBottom: 12 },
  modalText: { color: '#dff5ff', fontSize: 17, lineHeight: 26 },
  close: { color: '#00c8ee', fontWeight: '700', marginTop: 18 },
  audioActions: { flexDirection: 'row', marginBottom: 8 },
  audioAction: { flex: 1, backgroundColor: '#0b4658', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginRight: 8 },
  audioActionText: { color: '#eaf8ff', fontSize: 16, fontWeight: '700' },
  speedLabel: { color: '#7fa6b5', marginTop: 16, marginBottom: 8 },
  speedRow: { flexDirection: 'row', flexWrap: 'wrap' },
  speedPill: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#164657', marginRight: 8, marginBottom: 8 },
  speedPillActive: { backgroundColor: '#0b4658' },
  speedText: { color: '#dff5ff' },
  scrollValue: { minWidth: 64, textAlign: 'center', fontSize: 16, fontWeight: '700', paddingVertical: 10 },
  input: { minHeight: 130, borderWidth: 1, borderColor: '#164657', borderRadius: 12, color: '#fff', padding: 12, textAlignVertical: 'top' },
  save: { backgroundColor: '#00c8ee', padding: 14, borderRadius: 12, marginTop: 12, alignItems: 'center' },
  saveText: { fontWeight: '800', color: '#01202a' }
});
