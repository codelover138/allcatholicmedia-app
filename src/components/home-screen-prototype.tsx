import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi } from '@/lib/app-content';

const latestLinks = [
  { label: 'WATCH', title: 'Sunday Mass and daily reflections', meta: 'All Catholic Media', href: '/live' },
  { label: 'LISTEN', title: 'Pray the Rosary with us', meta: 'Daily Prayer', href: '/listen' },
  { label: 'READ', title: 'Stories to carry into your day', meta: 'Catholic formation', href: '/read' },
] as const;

export function HomeScreenPrototype() {
  const theme = useTheme();
  const liveQuery = useQuery({ queryKey: ['app', 'live-now'], queryFn: appContentApi.liveNow });
  const live = liveQuery.data?.data.live_now[0];
  const liveTitle = live?.title ?? 'Sunday Mass from Rome';

  return <ScrollView style={{ backgroundColor: theme.background }} contentContainerStyle={styles.scroll} refreshControl={<RefreshControl refreshing={liveQuery.isRefetching} onRefresh={() => liveQuery.refetch()} />}>
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ThemedView style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.wordmark}><ThemedText style={styles.cross} themeColor="gold">+</ThemedText><ThemedText type="smallBold" style={styles.wordmarkText}>All Catholic Media</ThemedText></View>
        <View style={[styles.notice, { borderColor: theme.border }]}><View style={styles.noticeDot} /></View>
      </ThemedView>
      <ThemedView style={styles.content}>
        <Link href="/live" asChild><Pressable style={({ pressed }) => [styles.liveBanner, pressed && styles.pressed]}><View style={styles.liveDot} /><View style={styles.liveCopy}><ThemedText type="smallBold" style={styles.liveLabel}>LIVE</ThemedText><ThemedText type="small" style={styles.liveTitle} numberOfLines={1}>{liveTitle}</ThemedText></View><ThemedText style={styles.liveArrow}>›</ThemedText></Pressable></Link>
        <ThemedText type="title" style={styles.greeting}>Peace be with you</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>One faith. One family. One place.</ThemedText>

        <Link href="/live" asChild><Pressable style={({ pressed }) => [styles.continueCard, { borderColor: theme.border, backgroundColor: theme.backgroundElement }, pressed && styles.pressed]}>
          <View style={[styles.videoPlaceholder, { backgroundColor: theme.backgroundSelected }]}><View style={styles.play}><ThemedText style={styles.playText}>PLAY</ThemedText></View><View style={styles.progressTrack}><View style={styles.progressFill} /></View></View>
          <View style={styles.continueBody}><ThemedText type="smallBold" style={styles.typeLabel}>CONTINUE WATCHING</ThemedText><ThemedText type="smallBold" style={styles.continueTitle}>A reflection for the week ahead</ThemedText><ThemedText type="small" themeColor="textSecondary">All Catholic Media · 18 min</ThemedText></View>
        </Pressable></Link>

        <View style={styles.dualCards}>
          <Link href="/pray" asChild><Pressable style={({ pressed }) => [styles.smallCard, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }, pressed && styles.pressed]}><ThemedText style={styles.cardSymbol}>+</ThemedText><ThemedText type="smallBold" style={styles.smallTitle}>Daily Rosary</ThemedText><ThemedText type="small" themeColor="textSecondary">A moment of prayer</ThemedText></Pressable></Link>
          <Link href="/more" asChild><Pressable style={({ pressed }) => [styles.smallCard, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }, pressed && styles.pressed]}><ThemedText themeColor="gold" style={styles.cardSymbol}>*</ThemedText><ThemedText type="smallBold" style={styles.smallTitle}>Saint of the Day</ThemedText><ThemedText type="small" themeColor="textSecondary">Discover their witness</ThemedText></Pressable></Link>
        </View>

        <ThemedText type="subtitle" style={styles.latestHeading}>Latest</ThemedText>
        <View style={styles.latestList}>{latestLinks.map((item, index) => <Link href={item.href} key={item.label} asChild><Pressable style={({ pressed }) => [styles.latestRow, { borderColor: theme.border }, pressed && styles.pressed]}><View style={[styles.iconTile, { backgroundColor: theme.backgroundSelected }]}><ThemedText type="smallBold" themeColor="gold">{index + 1}</ThemedText></View><View style={styles.latestCopy}><ThemedText type="smallBold" style={styles.typeLabel}>{item.label}</ThemedText><ThemedText type="smallBold" numberOfLines={1}>{item.title}</ThemedText><ThemedText type="small" themeColor="textSecondary">{item.meta}</ThemedText></View></Pressable></Link>)}</View>
      </ThemedView>
    </SafeAreaView>
  </ScrollView>;
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 }, safe: { paddingBottom: BottomTabInset + Spacing.two }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two, borderBottomWidth: 1 }, wordmark: { flexDirection: 'row', alignItems: 'center', gap: 5 }, cross: { fontSize: 16, fontWeight: 700 }, wordmarkText: { fontFamily: 'Georgia', fontSize: 13, color: '#f3f6fa' }, notice: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' }, noticeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#f3f6fa' }, content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, gap: 10 }, liveBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#060e1d', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9 }, liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#9b1c1c' }, liveCopy: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 }, liveLabel: { color: '#f3d46d', letterSpacing: 0.8, fontSize: 9 }, liveTitle: { color: '#f8fafc', fontSize: 10, lineHeight: 13 }, liveArrow: { color: '#c9a227', fontSize: 21, lineHeight: 22 }, greeting: { fontSize: 22, lineHeight: 26, marginTop: 1 }, intro: { marginTop: -8, fontSize: 10, lineHeight: 13 }, continueCard: { overflow: 'hidden', borderRadius: 12, borderWidth: 1 }, videoPlaceholder: { height: 86, alignItems: 'center', justifyContent: 'center' }, play: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#c9a227', alignItems: 'center', justifyContent: 'center' }, playText: { color: '#0d1f3c', fontWeight: 800, fontSize: 7 }, progressTrack: { height: 2, position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.14)' }, progressFill: { width: '64%', height: 2, backgroundColor: '#c9a227' }, continueBody: { paddingHorizontal: 10, paddingVertical: 7, gap: 1 }, typeLabel: { color: '#046bd2', fontSize: 7, letterSpacing: 0.6 }, continueTitle: { fontSize: 11, lineHeight: 13 }, dualCards: { flexDirection: 'row', gap: 8 }, smallCard: { flex: 1, minHeight: 64, borderRadius: 9, padding: 10, borderWidth: 1, gap: 3 }, cardSymbol: { fontSize: 13, fontWeight: 700, color: '#f3f6fa' }, smallTitle: { fontFamily: 'Georgia', fontSize: 10, color: '#f3f6fa' }, latestHeading: { fontSize: 13, lineHeight: 16, marginTop: 1 }, latestList: { gap: 6 }, latestRow: { flexDirection: 'row', gap: 8, alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1 }, iconTile: { width: 34, height: 34, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }, latestCopy: { flex: 1, gap: 0 }, pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
});
