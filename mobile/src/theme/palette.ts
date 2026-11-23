import { useSettingsStore } from '../state/useSettingsStore';

export type Palette = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  surfaceDeep: string;
  read: string;
  border: string;
  line: string;
  text: string;
  muted: string;
  accent: string;
  link: string;
  chrome: string;
};

export function palette(dark: boolean): Palette {
  if (dark) {
    return {
      bg: '#031f2b',
      surface: '#073040',
      surfaceAlt: '#052936',
      surfaceDeep: '#042430',
      read: '#0a3a4c',
      border: '#164657',
      line: '#113b49',
      text: '#eaf8ff',
      muted: '#7fa6b5',
      accent: '#76dcff',
      link: '#00c8ee',
      chrome: '#021820'
    };
  }
  return {
    bg: '#fbf7ee',
    surface: '#ffffff',
    surfaceAlt: '#f3efe4',
    surfaceDeep: '#efe8d8',
    read: '#e7f6fb',
    border: '#e2d7c3',
    line: '#eadfcd',
    text: '#18232a',
    muted: '#6f777b',
    accent: '#0b6f8a',
    link: '#007f9a',
    chrome: '#ffffff'
  };
}

export function usePalette() {
  const dark = useSettingsStore((state) => state.darkMode);
  return palette(dark);
}
