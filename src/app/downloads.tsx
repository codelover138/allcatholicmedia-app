import { Image } from 'expo-image';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { playAudio } from '@/components/audio-player';
import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { downloadsSupported, formatBytes, useDownloads, type DownloadEntry } from '@/lib/downloads';
import { formatShortDate } from '@/lib/format';

export default function DownloadsScreen() {
  const entriesMap = useDownloads((s) => s.entries);
  const ready = useDownloads((s) => s.ready);
  const remove = useDownloads((s) => s.remove);

  const entries = useMemo(
    () => Object.values(entriesMap).sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt)),
    [entriesMap],
  );
  const totalSize = useMemo(() => entries.reduce((n, e) => n + (e.size || 0), 0), [entries]);

  const play = (e: DownloadEntry) =>
    playAudio({
      id: e.episodeId,
      title: e.title,
      showName: e.showName,
      audioUrl: e.localUri,
      artwork: e.artwork,
    });

  const confirmRemove = (e: DownloadEntry) =>
    Alert.alert('Remove download?', `“${e.title}” will be deleted from this device.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => remove(e.episodeId) },
    ]);

  return (
    <ListScreen<DownloadEntry>
      title="Downloads"
      subtitle={
        !downloadsSupported
          ? 'Downloads are available in the mobile app.'
          : entries.length
            ? `${entries.length} episode${entries.length === 1 ? '' : 's'} · ${formatBytes(totalSize)} · plays offline`
            : 'Downloaded episodes play without a connection and never expire.'
      }
      data={entries}
      keyExtractor={(e) => String(e.episodeId)}
      isLoading={!ready && downloadsSupported}
      isError={false}
      emptyMessage={
        downloadsSupported
          ? 'No downloads yet. Tap ⤓ on any episode to save it for offline listening.'
          : 'Open the app on your phone to download episodes.'
      }
      renderItem={(e) => <DownloadRow entry={e} onPress={() => play(e)} onRemove={() => confirmRemove(e)} />}
    />
  );
}

function DownloadRow({
  entry,
  onPress,
  onRemove,
}: {
  entry: DownloadEntry;
  onPress: () => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.art, { backgroundColor: theme.backgroundSelected }]}>
        {entry.artwork ? (
          <Image source={{ uri: entry.artwork }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <ThemedText themeColor="gold" style={styles.artGlyph}>
            ♪
          </ThemedText>
        )}
        <View style={styles.playPill}>
          <ThemedText style={styles.playGlyph}>▶</ThemedText>
        </View>
      </View>
      <View style={styles.copy}>
        <ThemedText style={styles.title} numberOfLines={2}>
          {entry.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {[entry.showName, formatBytes(entry.size), formatShortDate(entry.downloadedAt)]
            .filter(Boolean)
            .join(' · ')}
        </ThemedText>
      </View>
      <Pressable
        onPress={onRemove}
        hitSlop={10}
        style={styles.trash}
        accessibilityRole="button"
        accessibilityLabel="Remove download">
        <ThemedText themeColor="textSecondary" style={styles.trashGlyph}>
          ✕
        </ThemedText>
      </Pressable>
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
  art: {
    width: 52,
    height: 52,
    borderRadius: 9,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artGlyph: { fontSize: 20 },
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
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 14, fontWeight: '600', lineHeight: 18, color: '#f3f6fa' },
  trash: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  trashGlyph: { fontSize: 14 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
