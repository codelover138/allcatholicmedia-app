import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, type ChannelDTO, type LiveStreamDTO } from '@/lib/app-content';
import { useAppStore } from '@/lib/app-store';

type Row =
  | { kind: 'header'; title: string }
  | { kind: 'stream'; stream: LiveStreamDTO }
  | { kind: 'channel'; channel: ChannelDTO }
  | { kind: 'empty'; message: string };

export default function LiveScreen() {
  const theme = useTheme();
  const openVideoModal = useAppStore((state) => state.openVideoModal);
  const [searchQuery, setSearchQuery] = useState('');

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
  const queryLower = searchQuery.toLowerCase().trim();

  if (liveNowQuery.data) {
    const filteredLive = liveNowQuery.data.data.live_now.filter(
      (s) => !queryLower || s.title.toLowerCase().includes(queryLower)
    );
    const filteredUpcoming = liveNowQuery.data.data.upcoming.filter(
      (s) => !queryLower || s.title.toLowerCase().includes(queryLower)
    );

    rows.push({ kind: 'header', title: 'Live Now' });
    if (filteredLive.length === 0) {
      rows.push({ kind: 'empty', message: 'Nothing live right now — check upcoming broadcasts below.' });
    } else {
      for (const stream of filteredLive) rows.push({ kind: 'stream', stream });
    }

    if (filteredUpcoming.length > 0) {
      rows.push({ kind: 'header', title: 'Upcoming Broadcasts' });
      for (const stream of filteredUpcoming) rows.push({ kind: 'stream', stream });
    }
  }

  if (channelsQuery.data) {
    const filteredChannels = channelsQuery.data.data.filter(
      (c) => !queryLower || c.name.toLowerCase().includes(queryLower)
    );

    rows.push({ kind: 'header', title: 'Featured Channels' });
    if (filteredChannels.length === 0) {
      rows.push({ kind: 'empty', message: 'No channels matching search.' });
    } else {
      for (const channel of filteredChannels) rows.push({ kind: 'channel', channel });
    }
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.maxContainer}>
        <View style={styles.header}>
          <ThemedText type="sectionHeader" themeColor="gold">
            FR. MORSIN LIVINGSTON BROADCAST NETWORK
          </ThemedText>
          <ThemedText type="heroTitle" style={styles.title}>
            Live TV & Channels
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 12 }}>
            Live Mass, Holy Adoration & Catholic Television by Fr. Morsin Livingston
          </ThemedText>

          {/* Search Input Bar */}
          <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Ionicons name="search" size={16} color={theme.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search streams or channels..."
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

        {isLoading ? <LoadingState message="Loading broadcasts..." /> : null}
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
            contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}
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
                  <View style={styles.sectionHeaderWrap}>
                    <ThemedText type="sectionHeader" themeColor="gold">
                      {item.title}
                    </ThemedText>
                  </View>
                );
              }
              if (item.kind === 'empty') {
                return <EmptyState message={item.message} />;
              }
              if (item.kind === 'stream') {
                return (
                  <StreamRow
                    stream={item.stream}
                    onOpenPlayer={() =>
                      openVideoModal(
                        item.stream.embed_url || 'https://www.youtube.com/embed/live_stream',
                        item.stream.title
                      )
                    }
                  />
                );
              }
              return (
                <ChannelRow
                  channel={item.channel}
                  onOpenChannel={() =>
                    openVideoModal(
                      item.channel.latest_video?.embed_url ||
                        `https://www.youtube.com/results?search_query=${encodeURIComponent(item.channel.name)}`,
                      item.channel.name
                    )
                  }
                />
              );
            }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function StreamRow({ stream, onOpenPlayer }: { stream: LiveStreamDTO; onOpenPlayer: () => void }) {
  const theme = useTheme();

  return (
    <Pressable onPress={onOpenPlayer} style={({ pressed }) => [styles.rowPressable, pressed && styles.pressed]}>
      <ThemedView variant="elevated" style={styles.streamRow}>
        <View style={styles.thumbWrap}>
          {stream.thumbnail ? (
            <Image source={{ uri: stream.thumbnail }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: theme.accentLight }]}>
              <Ionicons name="tv-outline" size={24} color={theme.accent} />
            </View>
          )}
          <View style={styles.playOverlay}>
            <Ionicons name="play" size={16} color="#ffffff" />
          </View>
        </View>

        <View style={styles.rowBody}>
          <View style={styles.badgeRow}>
            {stream.is_live ? (
              <View style={[styles.livePill, { backgroundColor: theme.live }]}>
                <View style={styles.pulseDot} />
                <ThemedText type="badge" style={{ color: '#ffffff' }}>
                  LIVE
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.scheduledPill, { backgroundColor: theme.goldSoft }]}>
                <Ionicons name="calendar-outline" size={10} color={theme.gold} />
                <ThemedText type="badge" themeColor="gold">
                  UPCOMING
                </ThemedText>
              </View>
            )}
            {stream.source_name ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {stream.source_name}
              </ThemedText>
            ) : null}
          </View>

          <ThemedText type="subtitle" numberOfLines={2} style={styles.streamTitle}>
            {stream.title}
          </ThemedText>

          {!stream.is_live && stream.scheduled_at ? (
            <ThemedText type="small" themeColor="textSecondary">
              {new Date(stream.scheduled_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </ThemedText>
          ) : null}
        </View>
      </ThemedView>
    </Pressable>
  );
}

function ChannelRow({ channel, onOpenChannel }: { channel: ChannelDTO; onOpenChannel: () => void }) {
  const theme = useTheme();

  return (
    <Pressable onPress={onOpenChannel} style={({ pressed }) => [styles.rowPressable, pressed && styles.pressed]}>
      <ThemedView variant="elevated" style={styles.channelRow}>
        {channel.thumbnail ? (
          <Image source={{ uri: channel.thumbnail }} style={styles.thumbRound} contentFit="cover" />
        ) : (
          <View style={[styles.thumbRoundPlaceholder, { backgroundColor: theme.accentLight }]}>
            <Ionicons name="radio" size={20} color={theme.accent} />
          </View>
        )}
        <View style={styles.rowBody}>
          <ThemedText type="subtitle" numberOfLines={1} style={styles.channelName}>
            {channel.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {channel.videos_count} published videos
          </ThemedText>
        </View>
        <View style={[styles.watchActionPill, { backgroundColor: theme.accentLight }]}>
          <ThemedText type="smallBold" themeColor="accent">
            Watch
          </ThemedText>
          <Ionicons name="chevron-forward" size={14} color={theme.accent} />
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
  sectionHeaderWrap: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  rowPressable: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  streamRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
  },
  channelRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  scheduledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  streamTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  channelName: {
    fontSize: 16,
    lineHeight: 22,
  },
  thumbWrap: {
    position: 'relative',
    width: 88,
    height: 60,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  thumb: {
    width: 88,
    height: 60,
    borderRadius: Radius.medium,
  },
  thumbPlaceholder: {
    width: 88,
    height: 60,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -14,
    marginLeft: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRound: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  thumbRoundPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  pressed: {
    opacity: 0.85,
  },
});

