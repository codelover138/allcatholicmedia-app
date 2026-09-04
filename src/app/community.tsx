import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppHeader } from '@/components/app-header';
import { useTheme } from '@/hooks/use-theme';

export default function CommunityScreen() {
  const theme = useTheme();
  return <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.background }]}><AppHeader /><View style={styles.content}><ThemedText type="subtitle" style={styles.title}>Community</ThemedText><ThemedText themeColor="textSecondary">Faithful conversation, moderated with care.</ThemedText><ThemedView style={[styles.post, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}><View style={styles.meta}><ThemedText type="smallBold" style={styles.badge}>EDITORIAL</ThemedText><ThemedText type="small" themeColor="textSecondary">Fr. Morson Livingston</ThemedText></View><ThemedText style={styles.quote}>"Even in ordinary time, the Lord is close. Take one quiet moment today to thank Him."</ThemedText></ThemedView><ThemedView style={[styles.note, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}><ThemedText type="small" themeColor="textSecondary">Member posts and comments will open after community guidelines, reporting, and moderation tools are ready.</ThemedText></ThemedView></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 18, gap: 13 }, title: { fontSize: 25, lineHeight: 30 }, post: { padding: 14, borderWidth: 1, borderRadius: 12, gap: 12 }, meta: { flexDirection: 'row', alignItems: 'center', gap: 8 }, badge: { color: '#ffffff', backgroundColor: '#0d1f3c', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99, fontSize: 10, letterSpacing: 0.5 }, quote: { color: '#f3f6fa', lineHeight: 23 }, note: { borderWidth: 1, borderRadius: 12, padding: 14 } });
