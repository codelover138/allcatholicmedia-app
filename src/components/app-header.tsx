import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AppHeader() {
  const theme = useTheme();

  return <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
    <View style={styles.wordmark}>
      <ThemedText style={styles.cross} themeColor="gold">+</ThemedText>
      <ThemedText type="smallBold" style={styles.wordmarkText}>All Catholic Media</ThemedText>
    </View>
    <View style={[styles.notice, { borderColor: theme.border }]}><View style={styles.noticeDot} /></View>
  </ThemedView>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingVertical: Spacing.two, borderBottomWidth: 1 },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cross: { fontSize: 22, fontWeight: 700 },
  wordmarkText: { fontFamily: 'Georgia', fontSize: 16, color: '#f3f6fa' },
  notice: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  noticeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f3f6fa' },
});
