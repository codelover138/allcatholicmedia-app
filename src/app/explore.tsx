import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { useVideoPlayer } from '@/components/video-player';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, mediaUrl } from '@/lib/app-content';
import { formatDuration, formatShortDate } from '@/lib/format';

type ExploreType = 'watch' | 'listen' | 'read' | 'saints';

type ExploreItem = {
  key: string;
  type: ExploreType;
  title: string;
  meta: string;
  url?: string;
  fallbackHref: Href;
  image?: string | null;
  isVideo?: boolean;
};

const FILTERS: ('all' | ExploreType)[] = ['all', 'watch', 'listen', 'read', 'saints'];

const TYPE_META: Record<ExploreType, { label: string; glyph: string; color: 'gold' | 'blue' }> = {
  watch: { label: 'WATCH', glyph: '▶', color: 'gold' },
  listen: { label: 'LISTEN', glyph: '♪', color: 'blue' },
  read: { label: 'READ', glyph: '▤', color: 'blue' },
  saints: { label: 'SAINTS', glyph: '✦', color: 'gold' },
};

function joinMeta(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ');
}

/** Weave several lists together so the browse feed alternates content types. */
function roundRobin<T>(...lists: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i += 1) {
    for (const list of lists) {
      if (i < list.length) out.push(list[i]);
    }
  }
  return out;
}

export default function ExploreScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { play } = useVideoPlayer();

  const [text, setText] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<'all' | ExploreType>('all');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = setTimeout(() => setDebounced(text.trim()), 300);
    return () => clearTimeout(id);
  }, [text]);

  const searching = debounced.length >= 2;

  const channelsQuery = useQuery({ queryKey: ['app', 'channels'], queryFn: appContentApi.channels });
  const listenQuery = useQuery({ queryKey: ['app', 'listen'], queryFn: () => appContentApi.listen() });
  const readQuery = useQuery({ queryKey: ['app', 'read'], queryFn: () => appContentApi.read() });
  const saintsQuery = useQuery({ queryKey: ['app', 'saints'], queryFn: () => appContentApi.saints() });
  const searchQuery = useQuery({
    queryKey: ['app', 'search', debounced],
    queryFn: () => appContentApi.search(debounced),
    enabled: searching,
    placeholderData: keepPreviousData,
  });

  const browseQueries = [channelsQuery, listenQuery, readQuery, saintsQuery];
  const activeQueries = searching ? [searchQuery] : browseQueries;

  const items = useMemo<ExploreItem[]>(() => {
    if (searching) {
      const d = searchQuery.data?.data;
      if (!d) return [];
      return [
        ...d.videos.map((v) => ({
          key: `w${v.id}`,
          type: 'watch' as const,
          title: v.title,
          meta: joinMeta('Watch', formatShortDate(v.published_at), formatDuration(v.duration)),
          url: v.video_url ?? undefined,
          fallbackHref: '/live' as const,
          image: v.thumbnail,
          isVideo: true,
        })),
        ...d.shows.map((s) => ({
          key: `l${s.slug}`,
          type: 'listen' as const,
          title: s.name,
          meta: joinMeta(s.category ?? 'Listen', s.episodes_count ? `${s.episodes_count} episodes` : undefined),
          fallbackHref: '/listen' as const,
          image: mediaUrl(s.thumbnail),
        })),
        ...d.episodes.map((e) => ({
          key: `e${e.id}`,
          type: 'listen' as const,
          title: e.title,
          meta: joinMeta('Episode', formatShortDate(e.published_at), formatDuration(e.duration)),
          url: e.embed_url ?? undefined,
          fallbackHref: '/listen' as const,
          image: mediaUrl(e.thumbnail),
        })),
        ...d.articles.map((a) => ({
          key: `r${a.id}`,
          type: 'read' as const,
          title: a.title,
          meta: joinMeta(a.categories?.[0]?.name ?? 'Read', formatShortDate(a.published_at)),
          url: a.url,
          fallbackHref: '/read' as const,
          image: mediaUrl(a.image),
        })),
        ...d.saints.map((a) => ({
          key: `s${a.id}`,
          type: 'saints' as const,
          title: a.title,
          meta: joinMeta('Saint', a.categories?.[0]?.name ?? 'Feast Days'),
          url: a.url,
          fallbackHref: '/more' as const,
          image: mediaUrl(a.image),
        })),
      ];
    }

    const watch = (channelsQuery.data?.data ?? [])
      .flatMap((c) => (c.latest_video ? [{ video: c.latest_video, channel: c.name }] : []))
      .sort((a, b) => (b.video.published_at ?? '').localeCompare(a.video.published_at ?? ''))
      .slice(0, 6)
      .map(({ video, channel }) => ({
        key: `w${video.id}`,
        type: 'watch' as const,
        title: video.title,
        meta: joinMeta(channel, formatShortDate(video.published_at), formatDuration(video.duration)),
        url: video.video_url ?? undefined,
        fallbackHref: '/live' as const,
        image: video.thumbnail,
        isVideo: true,
      }));

    const listen = (listenQuery.data?.data.shows ?? []).slice(0, 6).map((s) => ({
      key: `l${s.slug}`,
      type: 'listen' as const,
      title: s.name,
      meta: joinMeta(s.category ?? 'Listen', s.episodes_count ? `${s.episodes_count} episodes` : undefined),
      fallbackHref: '/listen' as const,
      image: mediaUrl(s.thumbnail),
    }));

    const read = (readQuery.data?.data.articles ?? []).slice(0, 8).map((a) => ({
      key: `r${a.id}`,
      type: 'read' as const,
      title: a.title,
      meta: joinMeta(a.categories?.[0]?.name ?? 'Read', formatShortDate(a.published_at)),
      url: a.url,
      fallbackHref: '/read' as const,
      image: mediaUrl(a.image),
    }));

    const saints = (saintsQuery.data?.data.saints ?? []).slice(0, 8).map((a) => ({
      key: `s${a.id}`,
      type: 'saints' as const,
      title: a.title,
      meta: joinMeta('Saint', a.categories?.[0]?.name ?? 'Feast Days'),
      url: a.url,
      fallbackHref: '/more' as const,
      image: mediaUrl(a.image),
    }));

    return roundRobin<ExploreItem>(watch, read, listen, saints);
  }, [searching, searchQuery.data, channelsQuery.data, listenQuery.data, readQuery.data, saintsQuery.data]);

  const filtered = filter === 'all' ? items : items.filter((i) => i.type === filter);

  const loading = filtered.length === 0 && activeQueries.some((q) => q.isLoading);
  const errored = filtered.length === 0 && activeQueries.every((q) => q.isError);

  const toggleSave = (key: string) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const open = (item: ExploreItem) =>
    item.url ? play(item.url, item.title) : router.push(item.fallbackHref);

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={[styles.safe, styles.transparent]}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText style={styles.title}>Explore</ThemedText>

        <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText themeColor="textSecondary" style={styles.searchIcon}>
            ⌕
          </ThemedText>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Search videos, articles, saints…"
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {text ? (
            <Pressable onPress={() => setText('')} hitSlop={10}>
              <ThemedText themeColor="textSecondary" style={styles.searchClear}>
                ✕
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.chips}>
          {FILTERS.map((f) => {
            const active = filter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.chip, { borderColor: theme.border }, active && styles.chipActive]}>
                <ThemedText style={[styles.chipText, active && styles.chipTextActive]}>
                  {f[0].toUpperCase() + f.slice(1)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <LoadingState />
        ) : errored ? (
          <ErrorState
            message="Could not load Explore."
            onRetry={() => activeQueries.forEach((q) => q.refetch())}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            message={searching ? `No results for “${debounced}”.` : 'Nothing to explore yet.'}
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((item) => (
              <ExploreRow
                key={item.key}
                item={item}
                saved={saved.has(item.key)}
                onToggleSave={() => toggleSave(item.key)}
                onOpen={() => open(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

function ExploreRow({
  item,
  saved,
  onToggleSave,
  onOpen,
}: {
  item: ExploreItem;
  saved: boolean;
  onToggleSave: () => void;
  onOpen: () => void;
}) {
  const theme = useTheme();
  const meta = TYPE_META[item.type];
  return (
    <Pressable
      onPress={onOpen}
      style={({ pressed }) => [
        styles.row,
        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected, borderColor: theme.border }]}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <ThemedText themeColor={meta.color} style={styles.thumbGlyph}>
            {meta.glyph}
          </ThemedText>
        )}
        {item.isVideo ? (
          <View style={styles.play}>
            <ThemedText style={styles.playGlyph}>▶</ThemedText>
          </View>
        ) : null}
      </View>
      <View style={styles.copy}>
        <ThemedText themeColor="blue" style={styles.rowLabel}>
          {meta.label}
        </ThemedText>
        <ThemedText style={styles.rowTitle} numberOfLines={2}>
          {item.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.rowMeta} numberOfLines={1}>
          {item.meta}
        </ThemedText>
      </View>
      <Pressable onPress={onToggleSave} hitSlop={10} style={styles.bookmark}>
        <ThemedText themeColor={saved ? 'gold' : 'textSecondary'} style={styles.bookmarkGlyph}>
          {saved ? '★' : '☆'}
        </ThemedText>
      </Pressable>
    </Pressable>
  );
}

const CARD_SHADOW = {
  shadowColor: '#00030b',
  shadowOpacity: 0.5,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  transparent: { backgroundColor: 'transparent' },
  content: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
  },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 32,
    color: '#f3f6fa',
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
  },
  searchIcon: { fontSize: 18 },
  searchInput: { flex: 1, paddingVertical: Spacing.three - 2, fontSize: 14 },
  searchClear: { fontSize: 14, paddingHorizontal: Spacing.one },

  chips: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two,
  },
  chipActive: { backgroundColor: '#c9a227', borderColor: '#c9a227' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#f3f6fa' },
  chipTextActive: { color: '#0d1f3c' },

  list: { gap: Spacing.two + 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two + 2,
    ...CARD_SHADOW,
  },
  thumb: {
    width: 76,
    height: 56,
    borderRadius: 9,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: { fontSize: 18, lineHeight: 22 },
  play: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(201,162,39,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: { color: '#0d1f3c', fontSize: 10, marginLeft: 2 },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  rowLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.6 },
  rowTitle: { fontSize: 14, fontWeight: '600', lineHeight: 18, color: '#f3f6fa' },
  rowMeta: { fontSize: 11.5, lineHeight: 15 },
  bookmark: { padding: Spacing.one },
  bookmarkGlyph: { fontSize: 18, lineHeight: 20 },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
