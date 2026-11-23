import 'react-native-gesture-handler';
import React, { useEffect, useMemo } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeDatabase } from './src/db/database';
import { useSettingsStore } from './src/state/useSettingsStore';
import { palette } from './src/theme/palette';

function ThemedStatusBar() {
  const appearance = useSettingsStore((state) => state.appearance);
  return <StatusBar style={appearance === 'light' ? 'dark' : 'light'} />;
}

export default function App() {
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  const appearance = useSettingsStore((state) => state.appearance);
  const navigationTheme = useMemo<Theme>(() => {
    const colors = palette(appearance);
    const base = appearance === 'light' ? DefaultTheme : DarkTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.bg,
        card: colors.bg,
        text: colors.text,
        border: colors.line,
        primary: colors.link
      }
    };
  }, [appearance]);

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <ThemedStatusBar />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
