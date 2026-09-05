import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { ErrorState, LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, type VideoDTO } from '@/lib/app-content';
import { formatDuration, formatShortDate } from '@/lib/format';

// Fallback for the Daily Rosary card when the /read Daily Rosary spotlight is
// unavailable: the traditional weekday assignment of the Rosary mysteries.
const ROSARY_MYSTERIES = [
  'The Glorious Mysteries', // Sun
  'The Joyful Mysteries', // Mon
  'The Sorrowful Mysteries', // Tue
  'The Glorious Mysteries', // Wed
  'The Luminous Mysteries', // Thu
  'The Sorrowful Mysteries', // Fri
  'The Joyful Mysteries', // Sat
];

export default function HomeScreen() {
  const theme = useTheme();

  const liveQuery = useQuery({ queryKey: ['app', 'live-now'], queryFn: appContentApi.liveNow });
  const channelsQuery = useQuery({ queryKey: ['app', 'channels'], queryFn: appContentApi.channels });
  const saintsQuery = useQuery({ queryKey: ['app', 'saints'], queryFn: () => appContentApi.saints() });
  const readQuery = useQuery({ queryKey: ['app', 'read'], queryFn: () => appContentApi.read() });
  const listenQuery = useQuery({ queryKey: ['app', 'listen'], queryFn: () => appContentApi.listen() });
  // Category 12 = "Daily Rosary" — the same spotlight the website home page pulls.
  const rosaryQuery = useQuery({
    queryKey: ['app', 'read', 'daily-rosary'],
    queryFn: () => appContentApi.read({ category: 12 }),
  });

  const queries = [liveQuery, channelsQuery, saintsQuery, readQuery, listenQuery, rosaryQuery];
  const refetchAll = () => queries.forEach((q) => q.refetch());

  const live = liveQuery.data?.data.live_now?.[0];
  const saint = saintsQuery.data?.data.saints?.[0];
  const article = readQuery.data?.data.articles?.[0];
  const show = listenQuery.data?.data.shows?.[0];
  const rosaryPost = rosaryQuery.data?.data.articles?.[0];
  const rosaryLabel =
    rosaryPost?.title.replace(/^\[Daily Rosary Meditations\]\s*/i, '') ??
    ROSARY_MYSTERIES[new Date().getDay()];

  const latestVideo = useMemo<(VideoDTO & { channel: string }) | undefined>(() => {
    const videos = (channelsQuery.data?.data ?? [])
      .flatMap((c) => (c.latest_video ? [{ ...c.latest_video, channel: c.name }] : []))
      .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
    return videos[0];
  }, [channelsQuery.data]);

  const initialLoading = queries.every((q) => q.isLoading);
  const allFailed = queries.every((q) => q.isError);

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={queries.some((q) => q.isRefetching)}
          onRefresh={refetchAll}
          tintColor={theme.textSecondary}
        />
      }>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <AppHeader />

        {initialLoading ? (
          <LoadingState />
        ) : allFailed ? (
          <ErrorState message="Could not reach All Catholic Media." onRetry={refetchAll} />
        ) : (
          <View style={styles.content}>
            {live ? <LiveBanner title={live.title} /> : null}

            <View>
              <ThemedText style={styles.greeting}>Peace be with you</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
                One faith. One family. One place.
              </ThemedText>
            </View>

            <ContinueCard video={latestVideo} />

            <View style={styles.dualCards}>
              <MiniCard
                href="/pray"
                symbol="✝"
                title="Daily Rosary"
                subtitle={rosaryLabel}
              />
              <MiniCard
                href="/more"
                symbol="✦"
                title="Saint of the Day"
                subtitle={saint?.title ?? 'A saint to discover'}
              />
            </View>

            <View>
              <ThemedText style={styles.latestHeading}>Latest</ThemedText>
              <View style={styles.latestList}>
                <LatestRow
                  href="/live"
                  glyph="▶"
                  glyphColor="gold"
                  label="Watch"
                  title={latestVideo?.title ?? 'Sunday Mass and daily reflections'}
                  meta={joinMeta(
                    latestVideo?.channel ?? 'All Catholic Media',
                    formatShortDate(latestVideo?.published_at),
                  )}
                />
                <LatestRow
                  href="/listen"
                  glyph="♪"
                  glyphColor="blue"
                  label="Listen"
                  title={show?.name ?? 'Pray the Rosary with us'}
                  meta={show?.category ?? 'Daily Prayer'}
                />
                <LatestRow
                  href="/read"
                  glyph="☰"
                  glyphColor="blue"
                  label="Read"
                  title={article?.title ?? 'Stories to carry into your day'}
                  meta={joinMeta(
                    article?.categories?.[0]?.name ?? 'Catholic formation',
                    formatShortDate(article?.published_at),
                  )}
                />
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ScrollView>
  );
}

function joinMeta(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ');
}

function LiveBanner({ title }: { title: string }) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/live')}
      style={({ pressed }) => [
        styles.liveBanner,
        { borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.liveDot} />
      <ThemedText style={styles.liveLabel}>LIVE</ThemedText>
      <ThemedText type="small" style={styles.liveTitle} numberOfLines={1}>
        {title}
      </ThemedText>
      <ThemedText style={styles.liveArrow}>›</ThemedText>
    </Pressable>
  );
}

function ContinueCard({ video }: { video?: (VideoDTO & { channel: string }) | undefined }) {
  const theme = useTheme();
  const router = useRouter();
  const title = video?.title ?? 'A reflection for the week ahead';
  const source = video?.channel ?? 'All Catholic Media';
  const duration = formatDuration(video?.duration) ?? '18 min';

  return (
    <Pressable
      onPress={() => router.push('/live')}
      style={({ pressed }) => [
        styles.continueCard,
        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}>
        {video?.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : null}
        <View style={styles.playButton}>
          <ThemedText style={styles.playGlyph}>▶</ThemedText>
        </View>
        {/* Progress fill is cosmetic until real playback state exists (no auth yet). */}
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>
      </View>
      <View style={styles.continueBody}>
        <ThemedText themeColor="blue" style={styles.typeLabel}>
          CONTINUE WATCHING
        </ThemedText>
        <ThemedText style={styles.continueTitle} numberOfLines={2}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
          {joinMeta(source, duration)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function MiniCard({
  href,
  symbol,
  title,
  subtitle,
}: {
  href: Href;
  symbol: string;
  title: string;
  subtitle: string;
}) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.miniCard,
        { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <ThemedText themeColor="gold" style={styles.miniSymbol}>
        {symbol}
      </ThemedText>
      <ThemedText style={styles.miniTitle}>{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.metaText} numberOfLines={2}>
        {subtitle}
      </ThemedText>
    </Pressable>
  );
}

function LatestRow({
  href,
  glyph,
  glyphColor,
  label,
  title,
  meta,
}: {
  href: Href;
  glyph: string;
  glyphColor: 'gold' | 'blue';
  label: string;
  title: string;
  meta: string;
}) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(href)}
      style={({ pressed }) => [
        styles.latestRow,
        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.iconTile,
          { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
        ]}>
        <ThemedText themeColor={glyphColor} style={styles.tileGlyph}>
          {glyph}
        </ThemedText>
      </View>
      <View style={styles.latestCopy}>
        <ThemedText themeColor="blue" style={styles.typeLabel}>
          {label.toUpperCase()}
        </ThemedText>
        <ThemedText style={styles.latestTitle} numberOfLines={1}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.metaText} numberOfLines={1}>
          {meta}
        </ThemedText>
      </View>
    </Pressable>
  );
}

// Lifts cards off the deep-navy page background the way the design's 1px border
// + soft shadow does on the light theme.
const CARD_SHADOW = {
  shadowColor: '#00030b',
  shadowOpacity: 0.5,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  safe: { paddingBottom: BottomTabInset + Spacing.four },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three },

  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#060e1d',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    ...CARD_SHADOW,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5484d' },
  liveLabel: { color: '#ffffff', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  liveTitle: { flex: 1, color: '#e7ecf3' },
  liveArrow: { color: '#c9a227', fontSize: 20, lineHeight: 22 },

  greeting: { fontFamily: Fonts.serif, fontWeight: '700', fontSize: 26, lineHeight: 32, color: '#f3f6fa' },
  intro: { marginTop: Spacing.half },

  continueCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', ...CARD_SHADOW },
  thumb: { height: 140, alignItems: 'center', justifyContent: 'center' },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(201,162,39,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: { color: '#0d1f3c', fontSize: 18, marginLeft: 3 },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  progressFill: { width: '64%', height: 3, backgroundColor: '#c9a227' },
  continueBody: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2, gap: 3 },
  typeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  continueTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: '#f3f6fa' },
  metaText: { fontSize: 12, lineHeight: 16 },

  dualCards: { flexDirection: 'row', gap: Spacing.two + 2 },
  miniCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
    ...CARD_SHADOW,
  },
  miniSymbol: { fontSize: 18, lineHeight: 22 },
  miniTitle: { fontFamily: Fonts.serif, fontWeight: '700', fontSize: 15, color: '#f3f6fa' },

  latestHeading: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#f3f6fa',
    marginBottom: Spacing.two + 2,
  },
  latestList: { gap: Spacing.two + 2 },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two + 2,
    borderRadius: 12,
    borderWidth: 1,
    ...CARD_SHADOW,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileGlyph: { fontSize: 16, lineHeight: 20 },
  latestCopy: { flex: 1, minWidth: 0, gap: 1 },
  latestTitle: { fontSize: 14, fontWeight: '600', color: '#f3f6fa' },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
