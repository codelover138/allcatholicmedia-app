import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppHeader } from '@/components/app-header';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const paths = [{ title: 'Watch', note: 'Live Mass, Rosary and video', href: '/live' }, { title: 'Listen', note: 'Podcasts and reflections', href: '/listen' }, { title: 'Read', note: 'Catholic stories and news', href: '/read' }, { title: 'Saints', note: 'Saints and feast days', href: '/more' }] as const;

export default function ExploreScreen() {
  const theme = useTheme();
  return <SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: theme.background }]}><AppHeader /><ScrollView contentContainerStyle={styles.content}>
    <ThemedText type="subtitle" style={styles.title}>Explore</ThemedText>
    <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}><ThemedText themeColor="textSecondary">Search videos, articles, saints...</ThemedText></View>
    <View style={styles.chips}>{['All', 'Watch', 'Listen', 'Read', 'Saints'].map((chip, index) => <ThemedView key={chip} style={[styles.chip, index === 0 ? styles.activeChip : { borderColor: theme.border }]}><ThemedText type="smallBold" style={index === 0 ? styles.activeChipText : undefined}>{chip}</ThemedText></ThemedView>)}</View>
    {paths.map((item, index) => <Link href={item.href} key={item.title} asChild><Pressable style={({ pressed }) => [styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, pressed && styles.pressed]}><View style={[styles.tile, { backgroundColor: theme.goldSoft }]}><ThemedText themeColor="gold" type="smallBold">{index + 1}</ThemedText></View><View style={styles.copy}><ThemedText type="smallBold" style={styles.label}>{item.title.toUpperCase()}</ThemedText><ThemedText type="smallBold">{item.title}</ThemedText><ThemedText type="small" themeColor="textSecondary">{item.note}</ThemedText></View><ThemedText themeColor="textSecondary">›</ThemedText></Pressable></Link>)}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 18, paddingBottom: BottomTabInset + Spacing.four, gap: 13 }, title: { fontSize: 25, lineHeight: 30 }, search: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 }, chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' }, chip: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 }, activeChip: { backgroundColor: '#c9a227', borderColor: '#c9a227' }, activeChipText: { color: '#0d1f3c' }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 12, padding: 12 }, tile: { width: 52, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, copy: { flex: 1, gap: 2 }, label: { color: '#046bd2', fontSize: 10, letterSpacing: 0.8 }, pressed: { opacity: 0.8 } });
