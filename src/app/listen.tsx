import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, mediaUrl, type PodcastShowDTO } from '@/lib/app-content';

export default function ListenScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [category, setCategory] = useState<string | null>(null);

  const listenQuery = useQuery({
    queryKey: ['app', 'listen', category],
    queryFn: () => appContentApi.listen(category ? { category } : undefined),
  });

  const data = listenQuery.data?.data;
  const categories = data?.categories ?? [];
  const shows = data?.shows ?? [];

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <AppHeader />
        <FlatList
          data={shows}
          keyExtractor={(s) => s.slug}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          refreshControl={
            <RefreshControl
              refreshing={listenQuery.isRefetching}
              onRefresh={() => listenQuery.refetch()}
              tintColor={theme.textSecondary}
            />
          }
          ListHeaderComponent={
            <View style={styles.head}>
              <View style={styles.titleRow}>
                <ThemedText style={styles.title}>Listen</ThemedText>
                <Pressable onPress={() => router.push('/downloads')} hitSlop={8}>
                  <ThemedText type="small" themeColor="blue">
                    Downloads ›
                  </ThemedText>
                </Pressable>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                Homilies, reflections, and the Rosary — for the commute, the walk, the quiet hour.
              </ThemedText>
              {categories.length ? (
                <View style={styles.chips}>
                  <Chip label="All" active={!category} onPress={() => setCategory(null)} />
                  {categories.map((c) => (
                    <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
                  ))}
                </View>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            listenQuery.isLoading ? (
              <LoadingState />
            ) : listenQuery.isError ? (
              <ErrorState message="Could not load podcasts." onRetry={() => listenQuery.refetch()} />
            ) : (
              <EmptyState message="No podcasts published yet." />
            )
          }
          renderItem={({ item }) => (
            <ShowRow show={item} onPress={() => router.push(`/show/${item.slug}`)} />
          )}
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <ThemedText
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: active ? theme.gold : theme.border, color: theme.text },
        active && { backgroundColor: theme.gold, color: '#0d1f3c' },
      ]}>
      {label}
    </ThemedText>
  );
}

function ShowRow({ show, onPress }: { show: PodcastShowDTO; onPress: () => void }) {
  const theme = useTheme();
  const art = mediaUrl(show.thumbnail);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}>
        {art ? (
          <Image source={{ uri: art }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        ) : (
          <ThemedText themeColor="gold" style={styles.thumbGlyph}>
            ♪
          </ThemedText>
        )}
      </View>
      <View style={styles.rowBody}>
        <ThemedText style={styles.rowTitle} numberOfLines={1}>
          {show.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {[show.category, `${show.episodes_count} episodes`].filter(Boolean).join(' · ')}
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
    flexGrow: 1,
  },
  head: { gap: Spacing.two, paddingBottom: Spacing.three },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 32,
    color: '#f3f6fa',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.one },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two - 1,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
  },
  sep: { height: Spacing.two + 2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.two + 2,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbGlyph: { fontSize: 22 },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#f3f6fa' },
  chevron: { fontSize: 20 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
