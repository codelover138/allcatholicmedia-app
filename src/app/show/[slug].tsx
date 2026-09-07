import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { playAudio } from '@/components/audio-player';
import { EmptyState, ErrorState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, mediaUrl, type PodcastEpisodeDTO } from '@/lib/app-content';
import { downloadsSupported, localAudioFor, useDownloads } from '@/lib/downloads';
import { formatDuration, formatShortDate } from '@/lib/format';

export default function ShowDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const query = useInfiniteQuery({
    queryKey: ['app', 'show', slug],
    queryFn: ({ pageParam = 1 }) => appContentApi.listenDetail(slug, { page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.pagination.has_more ? last.meta.pagination.current_page + 1 : undefined,
    enabled: !!slug,
  });

  const show = query.data?.pages[0]?.data.show;
  const episodes = query.data?.pages.flatMap((p) => p.data.episodes) ?? [];
  const showArt = mediaUrl(show?.thumbnail) ?? mediaUrl(show?.banner);

  const openEpisode = (e: PodcastEpisodeDTO) => {
    const src = localAudioFor(e.id) ?? e.audio_url;
    if (!src) return;
    playAudio({
      id: e.id,
      title: e.title,
      showName: show?.name,
      audioUrl: src,
      artwork: mediaUrl(e.thumbnail) ?? showArt,
      description: e.description,
    });
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/listen'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ThemedText style={styles.back}>‹ Back</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={episodes}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={styles.content}
          onEndReachedThreshold={0.4}
          onEndReached={() => query.hasNextPage && query.fetchNextPage()}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListHeaderComponent={
            <View style={styles.header}>
              <View style={[styles.art, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                {showArt ? (
                  <Image source={{ uri: showArt }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                ) : (
                  <ThemedText themeColor="gold" style={styles.artGlyph}>
                    ♪
                  </ThemedText>
                )}
              </View>
              <ThemedText style={styles.title}>{show?.name ?? 'Podcast'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {[show?.category, show ? `${show.episodes_count} episodes` : null].filter(Boolean).join(' · ')}
              </ThemedText>
              {show?.description ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.desc} numberOfLines={5}>
                  {show.description}
                </ThemedText>
              ) : null}
              <ThemedText type="smallBold" style={styles.episodesLabel}>
                EPISODES
              </ThemedText>
            </View>
          }
          ListEmptyComponent={
            query.isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={theme.accent} />
              </View>
            ) : query.isError ? (
              <ErrorState message="Could not load this show." onRetry={query.refetch} />
            ) : (
              <EmptyState message="No episodes yet." />
            )
          }
          ListFooterComponent={
            query.isFetchingNextPage ? (
              <View style={styles.center}>
                <ActivityIndicator color={theme.textSecondary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <EpisodeRow
              episode={item}
              onPress={() => openEpisode(item)}
              artwork={mediaUrl(item.thumbnail) ?? showArt}
              showName={show?.name}
            />
          )}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

function EpisodeRow({
  episode,
  artwork,
  showName,
  onPress,
}: {
  episode: PodcastEpisodeDTO;
  artwork: string | null;
  showName?: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const key = String(episode.id);
  const downloaded = useDownloads((s) => !!s.entries[key]);
  const downloadState = useDownloads((s) => s.active[key]);
  const startDownload = useDownloads((s) => s.download);
  const removeDownload = useDownloads((s) => s.remove);

  const meta = [
    formatShortDate(episode.published_at),
    formatDuration(episode.duration),
    downloaded ? 'Downloaded' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const onDownloadPress = () => {
    if (downloaded) {
      Alert.alert('Remove download?', 'This frees up space on your device.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeDownload(episode.id) },
      ]);
      return;
    }
    if (!episode.audio_url) return;
    startDownload({
      episodeId: episode.id,
      audioUrl: episode.audio_url,
      title: episode.title,
      showName,
      artwork,
    });
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={!episode.audio_url && !downloaded}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
        !episode.audio_url && !downloaded && styles.rowDisabled,
      ]}>
      <View style={[styles.rowArt, { backgroundColor: theme.backgroundSelected }]}>
        {artwork ? (
          <Image source={{ uri: artwork }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : null}
        <View style={styles.playPill}>
          <ThemedText style={styles.playGlyph}>▶</ThemedText>
        </View>
      </View>
      <View style={styles.rowCopy}>
        <ThemedText style={styles.rowTitle} numberOfLines={2}>
          {episode.episode_number ? `${episode.episode_number}. ` : ''}
          {episode.title}
        </ThemedText>
        {meta ? (
          <ThemedText type="small" themeColor="textSecondary">
            {meta}
          </ThemedText>
        ) : null}
      </View>

      {downloadsSupported && (episode.audio_url || downloaded) ? (
        <Pressable
          onPress={onDownloadPress}
          hitSlop={10}
          style={styles.dlBtn}
          accessibilityRole="button"
          accessibilityLabel={
            downloaded ? 'Remove download' : downloadState === 'downloading' ? 'Downloading' : 'Download episode'
          }>
          {downloadState === 'downloading' ? (
            <ActivityIndicator size="small" color={theme.textSecondary} />
          ) : (
            <ThemedText
              themeColor={downloaded ? 'gold' : downloadState === 'error' ? 'danger' : 'textSecondary'}
              style={styles.dlGlyph}>
              {downloaded ? '✓' : downloadState === 'error' ? '↻' : '⤓'}
            </ThemedText>
          )}
        </Pressable>
      ) : null}
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
  art: {
    width: 160,
    height: 160,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artGlyph: { fontSize: 48 },
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
  episodesLabel: { fontSize: 11, letterSpacing: 0.7, opacity: 0.8, alignSelf: 'flex-start', marginTop: Spacing.three },
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
  rowDisabled: { opacity: 0.5 },
  rowArt: {
    width: 52,
    height: 52,
    borderRadius: 9,
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
  dlBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dlGlyph: { fontSize: 17, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
