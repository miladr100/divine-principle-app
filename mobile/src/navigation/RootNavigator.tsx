import React from 'react';
import { Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, TabParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { IndexScreen } from '../screens/IndexScreen';
import { SearchScreen } from '../screens/SearchScreen';
import { StudyScreen } from '../screens/StudyScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ReaderScreen } from '../screens/ReaderScreen';
import { usePalette } from '../theme/palette';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, string> = {
  'Início': '⌂',
  'Índice': '☰',
  'Pesquisa': '⌕',
  'Meu Estudo': '✎',
  'Ajustes': '⚙'
};

function TabNavigator() {
  const colors = usePalette();
  return (
    <Tabs.Navigator screenOptions={({ route }) => ({
      headerStyle: { backgroundColor: colors.bg },
      headerTintColor: colors.text,
      tabBarStyle: { backgroundColor: colors.bg, borderTopColor: colors.line },
      sceneStyle: { backgroundColor: colors.bg },
      tabBarActiveTintColor: colors.link,
      tabBarInactiveTintColor: colors.muted,
      tabBarIcon: ({ color, size }) => (
        <Text style={{ color, fontSize: size, lineHeight: size + 4 }}>{TAB_ICONS[route.name]}</Text>
      )
    })}>
      <Tabs.Screen name="Início" component={HomeScreen} />
      <Tabs.Screen name="Índice" component={IndexScreen} />
      <Tabs.Screen name="Pesquisa" component={SearchScreen} />
      <Tabs.Screen name="Meu Estudo" component={StudyScreen} />
      <Tabs.Screen name="Ajustes" component={SettingsScreen} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const colors = usePalette();
  return (
    <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: colors.bg }, headerTintColor: colors.text, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Reader" component={ReaderScreen} options={{ headerShown: false, animation: 'none' }} />
    </Stack.Navigator>
  );
}
