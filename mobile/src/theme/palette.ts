import { Appearance, useSettingsStore } from '../state/useSettingsStore';

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

const light: Palette = {
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

const blue: Palette = {
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

const dark: Palette = {
  bg: '#000000',
  surface: '#141414',
  surfaceAlt: '#0c0c0c',
  surfaceDeep: '#080808',
  read: '#1c1c1c',
  border: '#2e2e2e',
  line: '#242424',
  text: '#f4f4f4',
  muted: '#9a9a9a',
  accent: '#f4f4f4',
  link: '#d0d0d0',
  chrome: '#000000'
};

export function palette(appearance: Appearance): Palette {
  if (appearance === 'light') return light;
  if (appearance === 'dark') return dark;
  return blue;
}

export function usePalette() {
  const appearance = useSettingsStore((state) => state.appearance);
  return palette(appearance);
}
