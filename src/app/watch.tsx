import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { playVideo } from '@/components/video-player';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, type VideoDTO } from '@/lib/app-content';
import { formatDuration, formatShortDate } from '@/lib/format';

type Sort = 'newest' | 'views';

export default function WatchScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [channel, setChannel] = useState<string | null>(null);
  const [sort, setSort] = useState<Sort>('newest');

  const channelsQuery = useQuery({ queryKey: ['app', 'channels'], queryFn: appContentApi.channels });
  const channels = channelsQuery.data?.data ?? [];

  const videosQuery = useInfiniteQuery({
    queryKey: ['app', 'videos', channel, sort],
    queryFn: ({ pageParam = 1 }) =>
      appContentApi.videos({
        channel: channel ?? undefined,
        sort: sort === 'views' ? 'views' : undefined,
        page: pageParam,
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.pagination.has_more ? last.meta.pagination.current_page + 1 : undefined,
  });

  const videos = videosQuery.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/live'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ThemedText style={styles.back}>‹ Back</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={videos}
          keyExtractor={(v) => String(v.id)}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          onEndReachedThreshold={0.4}
          onEndReached={() => videosQuery.hasNextPage && videosQuery.fetchNextPage()}
          ListHeaderComponent={
            <View style={styles.head}>
              <ThemedText style={styles.title}>Watch</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Every video, across every channel.
              </ThemedText>

              <View style={styles.chipsRow}>
                {(['newest', 'views'] as const).map((s) => {
                  const active = sort === s;
                  return (
                    <Pressable
                      key={s}
                      onPress={() => setSort(s)}
                      style={[styles.chip, { borderColor: theme.border }, active && styles.chipActive]}>
                      <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                        {s === 'newest' ? 'Newest' : 'Most viewed'}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>

              {channels.length > 0 ? (
                <FlatList
                  data={[{ slug: null, name: 'All channels' }, ...channels]}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(c) => c.slug ?? 'all'}
                  contentContainerStyle={styles.channelChips}
                  renderItem={({ item }) => {
                    const active = channel === item.slug;
                    return (
                      <Pressable
                        onPress={() => setChannel(item.slug)}
                        style={[styles.chip, { borderColor: theme.border }, active && styles.chipActive]}>
                        <ThemedText
                          style={[styles.chipText, active && styles.chipTextActive]}
                          numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                      </Pressable>
                    );
                  }}
                />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            videosQuery.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={theme.accent} />
              </View>
            ) : videosQuery.isError ? (
              <ErrorState message="Could not load videos." onRetry={() => videosQuery.refetch()} />
            ) : (
              <EmptyState message="No videos yet." />
            )
          }
          ListFooterComponent={
            videosQuery.isFetchingNextPage ? (
              <View style={styles.center}>
                <ActivityIndicator color={theme.textSecondary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <VideoRow video={item} onPress={() => playVideo(item.video_url, item.title)} />
          )}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

function VideoRow({ video, onPress }: { video: VideoDTO; onPress: () => void }) {
  const theme = useTheme();
  const meta = [formatShortDate(video.published_at), formatDuration(video.duration)]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}>
        {video.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : null}
        <View style={styles.playPill}>
          <ThemedText style={styles.playGlyph}>▶</ThemedText>
        </View>
      </View>
      <View style={styles.rowCopy}>
        <ThemedText style={styles.rowTitle} numberOfLines={2}>
          {video.title}
        </ThemedText>
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary">
            {meta}
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  topBar: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  back: { fontSize: 15, fontWeight: '600', color: '#f3f6fa' },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  head: { gap: Spacing.two, paddingBottom: Spacing.three },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 32,
    color: '#f3f6fa',
  },
  chipsRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  channelChips: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two - 2,
  },
  chipActive: { backgroundColor: '#c9a227', borderColor: '#c9a227' },
  chipText: { fontSize: 12.5, fontWeight: '600', color: '#f3f6fa' },
  chipTextActive: { color: '#0d1f3c' },
  sep: { height: Spacing.two + 2 },
  center: { paddingVertical: Spacing.six, alignItems: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two + 2,
  },
  thumb: {
    width: 92,
    height: 54,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  rowCopy: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '600', lineHeight: 18, color: '#f3f6fa' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
