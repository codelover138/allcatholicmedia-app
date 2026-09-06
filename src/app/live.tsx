import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { appContentApi, type ChannelDTO, type LiveStreamDTO } from '@/lib/app-content';

type Row =
  | { kind: 'header'; title: string }
  | { kind: 'stream'; stream: LiveStreamDTO }
  | { kind: 'channel'; channel: ChannelDTO }
  | { kind: 'empty'; message: string };

export default function LiveScreen() {
  const liveNowQuery = useQuery({
    queryKey: ['app', 'live-now'],
    queryFn: appContentApi.liveNow,
  });

  const channelsQuery = useQuery({
    queryKey: ['app', 'channels'],
    queryFn: appContentApi.channels,
  });

  const isLoading = liveNowQuery.isLoading || channelsQuery.isLoading;
  const isError = liveNowQuery.isError || channelsQuery.isError;

  const rows: Row[] = [];
  if (liveNowQuery.data) {
    rows.push({ kind: 'header', title: 'Live now' });
    if (liveNowQuery.data.data.live_now.length === 0) {
      rows.push({ kind: 'empty', message: 'Nothing live right now — check upcoming below.' });
    } else {
      for (const stream of liveNowQuery.data.data.live_now) rows.push({ kind: 'stream', stream });
    }

    if (liveNowQuery.data.data.upcoming.length > 0) {
      rows.push({ kind: 'header', title: 'Upcoming' });
      for (const stream of liveNowQuery.data.data.upcoming) rows.push({ kind: 'stream', stream });
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
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: 'transparent' }]}>
      <ThemedText type="title" style={styles.title}>
        Live
      </ThemedText>

      {isLoading ? <LoadingState /> : null}
      {isError ? (
        <ErrorState
          message="Could not load live streams and channels."
          onRetry={() => {
            liveNowQuery.refetch();
            channelsQuery.refetch();
          }}
        />
      ) : null}

      {!isLoading && !isError ? (
        <FlatList
          data={rows}
          keyExtractor={(row, index) => `${row.kind}-${index}`}
          contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.four }}
          refreshControl={
            <RefreshControl
              refreshing={liveNowQuery.isRefetching || channelsQuery.isRefetching}
              onRefresh={() => {
                liveNowQuery.refetch();
                channelsQuery.refetch();
              }}
            />
          }
          renderItem={({ item }) => {
            if (item.kind === 'header') {
              return (
                <ThemedText type="smallBold" themeColor="gold" style={styles.sectionHeader}>
                  {item.title.toUpperCase()}
                </ThemedText>
              );
            }
            if (item.kind === 'empty') {
              return <EmptyState message={item.message} />;
            }
            if (item.kind === 'stream') {
              return <StreamRow stream={item.stream} />;
            }
            return <ChannelRow channel={item.channel} />;
          }}
        />
      ) : null}
    </SafeAreaView>
    </ScreenBackground>
  );
}

function StreamRow({ stream }: { stream: LiveStreamDTO }) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      {stream.thumbnail ? (
        <Image source={{ uri: stream.thumbnail }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={styles.thumbPlaceholder} />
      )}
      <ThemedView style={styles.rowBody}>
        <ThemedText type="default" numberOfLines={2}>
          {stream.title}
        </ThemedText>
        <ThemedText type="small" themeColor={stream.is_live ? 'live' : 'textSecondary'}>
          {stream.is_live
            ? 'Live now'
            : stream.scheduled_at
              ? new Date(stream.scheduled_at).toLocaleString()
              : (stream.source_name ?? '')}
        </ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

function ChannelRow({ channel }: { channel: ChannelDTO }) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      {channel.thumbnail ? (
        <Image source={{ uri: channel.thumbnail }} style={styles.thumbRound} contentFit="cover" />
      ) : (
        <View style={styles.thumbRoundPlaceholder} />
      )}
      <ThemedView style={styles.rowBody}>
        <ThemedText type="default" numberOfLines={1}>
          {channel.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {channel.videos_count} videos
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
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    letterSpacing: 1,
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
    width: 64,
    height: 44,
    borderRadius: Spacing.one,
  },
  thumbPlaceholder: {
    width: 64,
    height: 44,
    borderRadius: Spacing.one,
    backgroundColor: 'rgba(169,129,47,0.25)',
  },
  thumbRound: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  thumbRoundPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(169,129,47,0.25)',
  },
});
