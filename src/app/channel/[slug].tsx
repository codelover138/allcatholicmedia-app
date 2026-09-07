import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

export default function ChannelDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const query = useInfiniteQuery({
    queryKey: ['app', 'channel', slug],
    queryFn: ({ pageParam = 1 }) => appContentApi.channelDetail(slug, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.pagination.has_more ? last.meta.pagination.current_page + 1 : undefined,
    enabled: !!slug,
  });

  const channel = query.data?.pages[0]?.data.channel;
  const videos = query.data?.pages.flatMap((p) => p.data.videos) ?? [];

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
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && query.fetchNextPage()}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={[styles.avatar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                {channel?.thumbnail ? (
                  <Image source={{ uri: channel.thumbnail }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <ThemedText themeColor="gold" style={styles.avatarGlyph}>
                    ▶
                  </ThemedText>
                )}
              </View>
              <ThemedText style={styles.title}>{channel?.name ?? 'Channel'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {channel ? `${channel.videos_count} videos` : ''}
              </ThemedText>
              {channel?.description ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.desc} numberOfLines={4}>
                  {channel.description}
                </ThemedText>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            query.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={theme.accent} />
              </View>
            ) : query.isError ? (
              <ErrorState message="Could not load this channel." onRetry={query.refetch} />
            ) : (
              <EmptyState message="No videos yet." />
            )
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={styles.center}>
                <ActivityIndicator color={theme.textSecondary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => <VideoRow video={item} onPress={() => playVideo(item.video_url, item.title)} />}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

function VideoRow({ video, onPress }: { video: VideoDTO; onPress: () => void }) {
  const theme = useTheme();
  const meta = [formatShortDate(video.published_at), formatDuration(video.duration)].filter(Boolean).join(' · ');
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
    paddingBottom: BottomTabInset + Spacing.six,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  header: { gap: Spacing.two, alignItems: 'center', paddingBottom: Spacing.three },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: { fontSize: 30 },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 22,
    lineHeight: 28,
    color: '#f3f6fa',
    textAlign: 'center',
    marginTop: Spacing.two,
  },
  desc: { lineHeight: 20, textAlign: 'center', marginTop: Spacing.one },
  sep: { height: Spacing.two + 2 },
  center: { paddingVertical: Spacing.five, alignItems: 'center' },
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
