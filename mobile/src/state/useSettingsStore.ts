import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ReadingDepth = 'red' | 'blue' | 'yellow' | 'full';
export type ScrollAtEnd = 'stop' | 'next';

type SettingsState = {
  fontSize: number;
  speechRate: number;
  autoContinueSection: boolean;
  showEditorialColors: boolean;
  readingDepth: ReadingDepth;
  darkMode: boolean;
  likedDays: number[];
  autoScroll: boolean;
  scrollSpeed: number;
  scrollAtEnd: ScrollAtEnd;
  setFontSize: (value: number) => void;
  setSpeechRate: (value: number) => void;
  setAutoContinueSection: (value: boolean) => void;
  setShowEditorialColors: (value: boolean) => void;
  setReadingDepth: (value: ReadingDepth) => void;
  setDarkMode: (value: boolean) => void;
  toggleLikedDay: (day: number) => void;
  setAutoScroll: (value: boolean) => void;
  setScrollSpeed: (value: number) => void;
  setScrollAtEnd: (value: ScrollAtEnd) => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSize: 19,
      speechRate: 1,
      autoContinueSection: true,
      showEditorialColors: true,
      readingDepth: 'full',
      darkMode: true,
      likedDays: [],
      autoScroll: false,
      scrollSpeed: 1,
      scrollAtEnd: 'stop',
      setFontSize: (fontSize) => set({ fontSize }),
      setSpeechRate: (speechRate) => set({ speechRate }),
      setAutoContinueSection: (autoContinueSection) => set({ autoContinueSection }),
      setShowEditorialColors: (showEditorialColors) => set({ showEditorialColors }),
      setReadingDepth: (readingDepth) => set({ readingDepth }),
      setDarkMode: (darkMode) => set({ darkMode }),
      setAutoScroll: (autoScroll) => set({ autoScroll }),
      setScrollSpeed: (scrollSpeed) => set({ scrollSpeed }),
      setScrollAtEnd: (scrollAtEnd) => set({ scrollAtEnd }),
      toggleLikedDay: (day) => set((state) => {
        const current = state.likedDays ?? [];
        return {
          likedDays: current.includes(day) ? current.filter((item) => item !== day) : [...current, day]
        };
      })
    }),
    {
      name: 'pd-settings',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);
