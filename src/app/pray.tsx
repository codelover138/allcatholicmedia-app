import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppHeader } from '@/components/app-header';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PrayScreen() {
  const theme = useTheme();
  return <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.background }]}><AppHeader /><View style={styles.content}><ThemedText type="subtitle" style={styles.title}>Pray</ThemedText><ThemedText themeColor="textSecondary">A place to bring your heart before God, alone or with the community.</ThemedText><ThemedView style={[styles.prayerCard, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}><ThemedText style={styles.cross}>+</ThemedText><ThemedText type="subtitle" style={styles.cardTitle}>Daily Prayer</ThemedText><ThemedText themeColor="textSecondary">The Angelus: a moment to pause and remember the Incarnation.</ThemedText><Pressable style={styles.goldButton}><ThemedText type="smallBold" style={styles.goldButtonText}>PRAY NOW</ThemedText></Pressable></ThemedView><ThemedView style={[styles.note, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}><ThemedText type="small" themeColor="textSecondary">Prayer requests with private and prayer-team visibility will arrive after the right safety and moderation tools are in place.</ThemedText></ThemedView></View></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 18, gap: 13 }, title: { fontSize: 25, lineHeight: 30 }, prayerCard: { padding: 18, borderRadius: 14, borderWidth: 1, gap: 10 }, cross: { color: '#c9a227', fontSize: 24, fontWeight: 700 }, cardTitle: { fontSize: 19, lineHeight: 24 }, goldButton: { alignSelf: 'flex-start', borderRadius: 99, backgroundColor: '#c9a227', paddingHorizontal: 18, paddingVertical: 10, marginTop: 4 }, goldButtonText: { color: '#0d1f3c', fontSize: 12, letterSpacing: 0.7 }, note: { padding: 14, borderWidth: 1, borderRadius: 12 } });
