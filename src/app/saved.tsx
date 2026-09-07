import { useInfiniteQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { openArticle } from '@/components/article-detail';
import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { useVideoPlayer } from '@/components/video-player';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { accountApi, type Bookmark } from '@/lib/auth-api';
import { mediaUrl } from '@/lib/app-content';

const TYPE_LABEL: Record<Bookmark['type'], string> = {
  article: 'READ',
  saint: 'SAINT',
  video: 'WATCH',
  episode: 'LISTEN',
  show: 'LISTEN',
  channel: 'CHANNEL',
};

export default function SavedScreen() {
  const { play } = useVideoPlayer();

  const query = useInfiniteQuery({
    queryKey: ['account', 'bookmarks', 'list'],
    queryFn: ({ pageParam = 1 }) => accountApi.bookmarks({ page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.pagination.has_more ? last.meta.pagination.current_page + 1 : undefined,
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  const open = (b: Bookmark) => {
    const item = b.item ?? {};
    if (b.type === 'article' || b.type === 'saint') {
      if (item.url) openArticle(b.type === 'saint' ? 'saints' : 'read', item.url, item.title);
      return;
    }
    if (b.type === 'video' && item.video_url) {
      play(item.video_url, item.title);
    }
  };

  return (
    <ListScreen<Bookmark>
      title="Saved items"
      subtitle="Save reflections, videos, and prayers to return to them anytime."
      data={items}
      keyExtractor={(b) => `${b.type}-${b.id}`}
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={query.refetch}
      onRefresh={query.refetch}
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onEndReached={() => query.hasNextPage && query.fetchNextPage()}
      loadingMore={query.isFetchingNextPage}
      emptyMessage="Save reflections, videos, and prayers to return to them anytime."
      renderItem={(b) => <SavedRow bookmark={b} onPress={() => open(b)} />}
    />
  );
}

function SavedRow({ bookmark, onPress }: { bookmark: Bookmark; onPress: () => void }) {
  const theme = useTheme();
  const item = bookmark.item ?? {};
  const title = item.title || item.name || 'Saved item';
  const image = item.image ?? item.thumbnail ?? null;
  const resolved = typeof image === 'string' ? mediaUrl(image) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
        {resolved ? (
          <Image source={{ uri: resolved }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <ThemedText themeColor="gold" style={styles.thumbGlyph}>
            ✝
          </ThemedText>
        )}
      </View>
      <View style={styles.copy}>
        <ThemedText themeColor="blue" style={styles.label}>
          {TYPE_LABEL[bookmark.type]}
        </ThemedText>
        <ThemedText style={styles.title} numberOfLines={2}>
          {title}
        </ThemedText>
      </View>
      <ThemedText themeColor="textSecondary" style={styles.chevron}>
        ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two + 2,
  },
  thumb: {
    width: 72,
    height: 54,
    borderRadius: 9,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: { fontSize: 18 },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  label: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.6 },
  title: { fontSize: 14, fontWeight: '600', lineHeight: 18, color: '#f3f6fa' },
  chevron: { fontSize: 20 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
