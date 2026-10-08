import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PodcastEpisodesModal } from '@/components/podcast-episodes-modal';
import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, type PodcastShowDTO } from '@/lib/app-content';

export default function ListenScreen() {
  const theme = useTheme();
  const [selectedShow, setSelectedShow] = useState<PodcastShowDTO | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const listenQuery = useQuery({
    queryKey: ['app', 'listen'],
    queryFn: () => appContentApi.listen(),
  });

  const queryLower = searchQuery.toLowerCase().trim();
  const shows = (listenQuery.data?.data.shows ?? []).filter(
    (s) => !queryLower || s.name.toLowerCase().includes(queryLower) || (s.category && s.category.toLowerCase().includes(queryLower))
  );

  return (
    <>
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.background }]}>
        <View style={styles.maxContainer}>
          <View style={styles.header}>
            <ThemedText type="sectionHeader" themeColor="gold">
              FR. MORSIN LIVINGSTON AUDIO MINISTRY
            </ThemedText>
            <ThemedText type="heroTitle" style={styles.title}>
              Listen & Podcasts
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 12 }}>
              Daily audio discourses, Rosary prayers & homilies by Fr. Morsin Livingston
            </ThemedText>

            {/* Search Input Bar */}
            <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Ionicons name="search" size={16} color={theme.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search podcast shows or topics..."
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {listenQuery.isLoading ? <LoadingState message="Loading podcasts..." /> : null}
          {listenQuery.isError ? (
            <ErrorState
              message={
                listenQuery.error instanceof Error
                  ? listenQuery.error.message
                  : 'Could not load podcasts.'
              }
              onRetry={() => listenQuery.refetch()}
            />
          ) : null}
          {listenQuery.data && shows.length === 0 ? (
            <EmptyState message="No podcasts matching your search." />
          ) : null}

          {shows.length > 0 ? (
            <FlatList
              data={shows}
              keyExtractor={(show) => show.slug}
              contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}
              refreshControl={
                <RefreshControl refreshing={listenQuery.isRefetching} onRefresh={() => listenQuery.refetch()} />
              }
              renderItem={({ item }) => (
                <ShowRow show={item} onSelectShow={() => setSelectedShow(item)} />
              )}
            />
          ) : null}
        </View>
      </SafeAreaView>

      <PodcastEpisodesModal show={selectedShow} onClose={() => setSelectedShow(null)} />
    </>
  );
}

function ShowRow({ show, onSelectShow }: { show: PodcastShowDTO; onSelectShow: () => void }) {
  const theme = useTheme();

  return (
    <Pressable onPress={onSelectShow} style={({ pressed }) => [styles.rowPressable, pressed && styles.pressed]}>
      <ThemedView variant="elevated" style={styles.showRow}>
        <View style={styles.thumbWrap}>
          {show.thumbnail ? (
            <Image source={{ uri: show.thumbnail }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: theme.goldSoft }]}>
              <Ionicons name="headset" size={24} color={theme.gold} />
            </View>
          )}
        </View>

        <View style={styles.rowBody}>
          {show.category ? (
            <View style={[styles.categoryPill, { backgroundColor: theme.goldSoft }]}>
              <ThemedText type="badge" themeColor="gold">
                {show.category}
              </ThemedText>
            </View>
          ) : null}

          <ThemedText type="subtitle" numberOfLines={1} style={styles.showName}>
            {show.name}
          </ThemedText>

          <View style={styles.metaRow}>
            <Ionicons name="mic-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="small" themeColor="textSecondary">
              {show.episodes_count} episodes
            </ThemedText>
          </View>
        </View>

        <View style={[styles.playButton, { backgroundColor: theme.accent }]}>
          <Ionicons name="play" size={16} color="#ffffff" />
        </View>
      </ThemedView>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  maxContainer: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.half,
  },
  title: {
    marginTop: Spacing.half,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.oneHalf,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  rowPressable: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  showRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  showName: {
    fontSize: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  thumbWrap: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  thumb: {
    width: 68,
    height: 68,
    borderRadius: Radius.medium,
  },
  thumbPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});

