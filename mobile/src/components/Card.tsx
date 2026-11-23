import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { usePalette } from '../theme/palette';

export function Card({ children }: PropsWithChildren) {
  const colors = usePalette();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}
const styles = StyleSheet.create({
  card: { borderWidth:1, borderRadius:18, padding:18, marginBottom:14 }
});
