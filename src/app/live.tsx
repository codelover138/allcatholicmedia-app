import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { playVideo } from '@/components/video-player';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, type ChannelDTO, type LiveStreamDTO } from '@/lib/app-content';

type Row =
  | { kind: 'header'; title: string }
  | { kind: 'stream'; stream: LiveStreamDTO }
  | { kind: 'channel'; channel: ChannelDTO }
  | { kind: 'empty'; message: string };

/** "in 2 hr 15 min" / "in 3 days" / null when past or missing. */
function timeUntil(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `in ${hrs} hr${hrs === 1 ? '' : 's'}`;
  const days = Math.round(hrs / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

export default function LiveScreen() {
  const router = useRouter();
  const theme = useTheme();

  const liveNowQuery = useQuery({ queryKey: ['app', 'live-now'], queryFn: appContentApi.liveNow });
  const channelsQuery = useQuery({ queryKey: ['app', 'channels'], queryFn: appContentApi.channels });

  const isLoading = liveNowQuery.isLoading || channelsQuery.isLoading;
  const isError = liveNowQuery.isError && channelsQuery.isError;
  const refetch = () => {
    liveNowQuery.refetch();
    channelsQuery.refetch();
  };

  const rows: Row[] = [];
  if (liveNowQuery.data) {
    const { live_now, upcoming } = liveNowQuery.data.data;
    rows.push({ kind: 'header', title: 'Live now' });
    if (live_now.length === 0) {
      rows.push({ kind: 'empty', message: 'Nothing live right now — see what’s upcoming below.' });
    } else {
      for (const stream of live_now) rows.push({ kind: 'stream', stream });
    }
    if (upcoming.length > 0) {
      rows.push({ kind: 'header', title: 'Upcoming' });
      for (const stream of upcoming) rows.push({ kind: 'stream', stream });
    }
  }
  if (channelsQuery.data) {
    rows.push({ kind: 'header', title: 'Channels' });
    if (channelsQuery.data.data.length === 0) {
      rows.push({ kind: 'empty', message: 'No channels yet.' });
    } else {
      for (const channel of channelsQuery.data.data) rows.push({ kind: 'channel', channel });
    }
  }

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <AppHeader />
        {isLoading ? (
          <LoadingState />
        ) : isError ? (
          <ErrorState message="Could not load live streams and channels." onRetry={refetch} />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(row, i) => `${row.kind}-${i}`}
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={liveNowQuery.isRefetching || channelsQuery.isRefetching}
                onRefresh={refetch}
                tintColor={theme.textSecondary}
              />
            }
            ListHeaderComponent={
              <ThemedText style={styles.title}>Live &amp; Channels</ThemedText>
            }
            renderItem={({ item }) => {
              if (item.kind === 'header') {
                return (
                  <ThemedText type="smallBold" themeColor="gold" style={styles.sectionHeader}>
                    {item.title.toUpperCase()}
                  </ThemedText>
                );
              }
              if (item.kind === 'empty') return <EmptyState message={item.message} />;
              if (item.kind === 'stream') {
                return <StreamRow stream={item.stream} onPress={() => playVideo(item.stream.embed_url, item.stream.title)} />;
              }
              return (
                <ChannelRow channel={item.channel} onPress={() => router.push(`/channel/${item.channel.slug}`)} />
              );
            }}
          />
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

function StreamRow({ stream, onPress }: { stream: LiveStreamDTO; onPress: () => void }) {
  const theme = useTheme();
  const soon = timeUntil(stream.scheduled_at);
  const playable = stream.is_live && !!stream.embed_url;
  return (
    <Pressable
      onPress={playable ? onPress : undefined}
      disabled={!playable}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
        !playable && styles.rowMuted,
      ]}>
      <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}>
        {stream.thumbnail ? (
          <Image source={{ uri: stream.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : null}
        {playable ? (
          <View style={styles.playPill}>
            <ThemedText style={styles.playGlyph}>▶</ThemedText>
          </View>
        ) : null}
      </View>
      <View style={styles.rowBody}>
        <ThemedText style={styles.rowTitle} numberOfLines={2}>
          {stream.title}
        </ThemedText>
        <View style={styles.metaRow}>
          {stream.is_live ? (
            <>
              <View style={styles.liveDot} />
              <ThemedText type="small" style={{ color: theme.live, fontWeight: '700' }}>
                LIVE NOW
              </ThemedText>
            </>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              {soon
                ? `Starts ${soon}`
                : stream.scheduled_at
                  ? new Date(stream.scheduled_at).toLocaleString()
                  : (stream.source_name ?? 'Scheduled')}
            </ThemedText>
          )}
        </View>
      </View>
    </Pressable>
  );
}

function ChannelRow({ channel, onPress }: { channel: ChannelDTO; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
        {channel.thumbnail ? (
          <Image source={{ uri: channel.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <ThemedText themeColor="gold" style={styles.avatarGlyph}>
            ▶
          </ThemedText>
        )}
      </View>
      <View style={styles.rowBody}>
        <ThemedText style={styles.rowTitle} numberOfLines={1}>
          {channel.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {channel.videos_count} videos
        </ThemedText>
      </View>
      <ThemedText themeColor="textSecondary" style={styles.chevron}>
        ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.six,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 32,
    color: '#f3f6fa',
  },
  sectionHeader: { letterSpacing: 1, paddingTop: Spacing.four, paddingBottom: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two + 2,
    marginBottom: Spacing.two + 2,
  },
  rowMuted: { opacity: 0.72 },
  thumb: {
    width: 92,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: { fontSize: 18 },
  playPill: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(201,162,39,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: { color: '#0d1f3c', fontSize: 10, marginLeft: 2 },
  rowBody: { flex: 1, minWidth: 0, gap: 3 },
  rowTitle: { fontSize: 14, fontWeight: '600', lineHeight: 18, color: '#f3f6fa' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one + 2 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#e5484d' },
  chevron: { fontSize: 20 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
