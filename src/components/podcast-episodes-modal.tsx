import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import React from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, type PodcastEpisodeDTO, type PodcastShowDTO } from '@/lib/app-content';
import { useAppStore } from '@/lib/app-store';

type PodcastEpisodesModalProps = {
  show: PodcastShowDTO | null;
  onClose: () => void;
};

export function PodcastEpisodesModal({ show, onClose }: PodcastEpisodesModalProps) {
  const theme = useTheme();
  const playTrack = useAppStore((state) => state.playTrack);
  const currentTrack = useAppStore((state) => state.currentTrack);
  const isPlaying = useAppStore((state) => state.isPlaying);

  const detailQuery = useQuery({
    queryKey: ['app', 'listen-detail', show?.slug],
    queryFn: () => (show ? appContentApi.listenDetail(show.slug) : Promise.reject('No show')),
    enabled: Boolean(show),
  });

  if (!show) return null;

  const episodes = detailQuery.data?.data.episodes ?? [];

  const handlePlayEpisode = (ep: PodcastEpisodeDTO) => {
    playTrack({
      id: String(ep.id),
      title: ep.title,
      showName: show.name,
      audioUrl: ep.audio_url || ep.embed_url || '',
      artwork: ep.thumbnail || show.thumbnail || undefined,
      duration: ep.duration ? String(ep.duration) : undefined,
    });
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <ThemedView variant="elevated" style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.showMetaRow}>
              {show.thumbnail ? (
                <Image source={{ uri: show.thumbnail }} style={styles.showAvatar} contentFit="cover" />
              ) : (
                <View style={[styles.showAvatarPlaceholder, { backgroundColor: theme.goldSoft }]}>
                  <Ionicons name="headset" size={24} color={theme.gold} />
                </View>
              )}

              <View style={styles.headerTextWrap}>
                <ThemedText type="subtitle" numberOfLines={1} style={styles.showTitle}>
                  {show.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {show.category ? `${show.category} · ` : ''}
                  {show.episodes_count} episodes
                </ThemedText>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* Episode List Body */}
          {detailQuery.isLoading ? <LoadingState message="Loading show episodes..." /> : null}
          {detailQuery.isError ? (
            <ErrorState message="Could not load show episodes." onRetry={() => detailQuery.refetch()} />
          ) : null}
          {detailQuery.data && episodes.length === 0 ? (
            <EmptyState message="No episodes available for this show." />
          ) : null}

          {episodes.length > 0 ? (
            <FlatList
              data={episodes}
              keyExtractor={(ep) => String(ep.id)}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isTrackActive = currentTrack?.id === String(item.id);
                const isTrackPlaying = isTrackActive && isPlaying;

                return (
                  <Pressable
                    onPress={() => handlePlayEpisode(item)}
                    style={({ pressed }) => [
                      styles.episodeRowPressable,
                      pressed && styles.pressed,
                    ]}>
                    <ThemedView
                      variant={isTrackActive ? 'gold' : 'card'}
                      style={styles.episodeCard}>
                      <View style={styles.epMainInfo}>
                        <ThemedText type="subtitle" numberOfLines={2} style={styles.epTitle}>
                          {item.title}
                        </ThemedText>
                        {item.description ? (
                          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                            {item.description}
                          </ThemedText>
                        ) : null}

                        <View style={styles.epMetaRow}>
                          {item.duration ? (
                            <View style={styles.metaBadge}>
                              <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                              <ThemedText type="small" themeColor="textSecondary">
                                {item.duration}
                              </ThemedText>
                            </View>
                          ) : null}
                          {item.published_at ? (
                            <ThemedText type="small" themeColor="textSecondary">
                              {new Date(item.published_at).toLocaleDateString()}
                            </ThemedText>
                          ) : null}
                        </View>
                      </View>

                      <View
                        style={[
                          styles.playActionBtn,
                          { backgroundColor: isTrackPlaying ? theme.gold : theme.accent },
                        ]}>
                        <Ionicons
                          name={isTrackPlaying ? 'pause' : 'play'}
                          size={18}
                          color="#ffffff"
                        />
                      </View>
                    </ThemedView>
                  </Pressable>
                );
              }}
            />
          ) : null}
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    maxHeight: '85%',
    borderTopLeftRadius: Radius.xlarge,
    borderTopRightRadius: Radius.xlarge,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  showMetaRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginRight: Spacing.two,
  },
  showAvatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
  },
  showAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  showTitle: {
    fontSize: 18,
    lineHeight: 22,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  listContent: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  episodeRowPressable: {
    width: '100%',
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  epMainInfo: {
    flex: 1,
    gap: Spacing.one,
  },
  epTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  epMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.half,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
