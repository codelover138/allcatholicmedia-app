import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { appContentApi, type PodcastShowDTO } from '@/lib/app-content';

export default function ListenScreen() {
  const listenQuery = useQuery({
    queryKey: ['app', 'listen'],
    queryFn: () => appContentApi.listen(),
  });

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: 'transparent' }]}>
      <ThemedText type="title" style={styles.title}>
        Listen
      </ThemedText>

      {listenQuery.isLoading ? <LoadingState /> : null}
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
      {listenQuery.data && listenQuery.data.data.shows.length === 0 ? (
        <EmptyState message="No podcasts published yet." />
      ) : null}

      {listenQuery.data && listenQuery.data.data.shows.length > 0 ? (
        <FlatList
          data={listenQuery.data.data.shows}
          keyExtractor={(show) => show.slug}
          contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.four }}
          refreshControl={
            <RefreshControl refreshing={listenQuery.isRefetching} onRefresh={() => listenQuery.refetch()} />
          }
          renderItem={({ item }) => <ShowRow show={item} />}
        />
      ) : null}
    </SafeAreaView>
    </ScreenBackground>
  );
}

function ShowRow({ show }: { show: PodcastShowDTO }) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      {show.thumbnail ? (
        <Image source={{ uri: show.thumbnail }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={styles.thumbPlaceholder} />
      )}
      <ThemedView style={styles.rowBody}>
        <ThemedText type="default" numberOfLines={1}>
          {show.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {show.category ? `${show.category} · ` : ''}
          {show.episodes_count} episodes
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
  },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(169,129,47,0.25)',
  },
});
