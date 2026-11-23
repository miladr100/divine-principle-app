import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { initializeDatabase } from './src/db/database';
import { useSettingsStore } from './src/state/useSettingsStore';

function ThemedStatusBar() {
  const dark = useSettingsStore((state) => state.darkMode);
  return <StatusBar style={dark ? 'light' : 'dark'} />;
}

export default function App() {
  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ThemedStatusBar />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
