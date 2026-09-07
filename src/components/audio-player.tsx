import { Image } from 'expo-image';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatClock } from '@/lib/format';

export type AudioTrack = {
  id: string | number;
  title: string;
  showName?: string;
  audioUrl: string;
  artwork?: string | null;
  description?: string | null;
};

// ── Module-level store so playAudio() works from any screen (mirrors the
//    video-player pattern; native tabs don't reliably pass React context).
let current: AudioTrack | null = null;
let expanded = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function playAudio(track: AudioTrack) {
  if (!track.audioUrl) return;
  current = track;
  expanded = true;
  emit();
}
export function closeAudio() {
  current = null;
  expanded = false;
  emit();
}
function setExpanded(v: boolean) {
  expanded = v;
  emit();
}

export function useAudioController() {
  const snap = useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
  return { play: playAudio, close: closeAudio, current: snap };
}

const SPEEDS = [1, 1.25, 1.5, 1.75, 2];

/** Mount once at the app root, outside the tab navigator. */
export function AudioPlayerHost() {
  const theme = useTheme();
  const track = useSyncExternalStore(
    subscribe,
    () => current,
    () => current,
  );
  const isExpanded = useSyncExternalStore(
    subscribe,
    () => expanded,
    () => expanded,
  );

  const player = useAudioPlayer(undefined, { updateInterval: 700 });
  const status = useAudioPlayerStatus(player);
  const [speedIdx, setSpeedIdx] = useState(0);
  const loadedFor = useRef<string | number | null>(null);
  const scrubWidth = useRef(0);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  }, []);

  // Load a new track when `current` changes.
  useEffect(() => {
    if (!track) {
      loadedFor.current = null;
      try {
        player.pause();
      } catch {}
      return;
    }
    if (loadedFor.current === track.id) return;
    loadedFor.current = track.id;
    try {
      player.replace({ uri: track.audioUrl });
      player.play();
      player.setActiveForLockScreen?.(true, {
        title: track.title,
        artist: track.showName ?? 'All Catholic Media',
        artworkUrl: track.artwork ?? undefined,
      });
    } catch {}
  }, [track, player]);

  if (!track) return null;

  const duration = status.duration || 0;
  const position = Math.min(status.currentTime || 0, duration || Number.MAX_SAFE_INTEGER);
  const progress = duration > 0 ? position / duration : 0;
  const playing = status.playing;

  const toggle = () => (playing ? player.pause() : player.play());
  const skip = (delta: number) => {
    const next = Math.max(0, Math.min((status.currentTime || 0) + delta, duration || 0));
    player.seekTo(next).catch(() => {});
  };
  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    try {
      player.setPlaybackRate(SPEEDS[next]);
    } catch {}
  };

  return (
    <>
      {/* Mini player, docked above the tab bar */}
      {!isExpanded ? (
        <Pressable
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel={`Now playing: ${track.title}. Open player`}
          style={[styles.mini, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={[styles.miniProgress, { backgroundColor: theme.border }]}>
            <View style={[styles.miniProgressFill, { width: `${progress * 100}%`, backgroundColor: theme.gold }]} />
          </View>
          <View style={styles.miniRow}>
            <View style={[styles.miniArt, { backgroundColor: theme.backgroundSelected }]}>
              {track.artwork ? (
                <Image source={{ uri: track.artwork }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <ThemedText themeColor="gold" style={styles.miniArtGlyph}>
                  ♪
                </ThemedText>
              )}
            </View>
            <View style={styles.miniCopy}>
              <ThemedText style={styles.miniTitle} numberOfLines={1}>
                {track.title}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {status.isBuffering ? 'Buffering…' : (track.showName ?? 'All Catholic Media')}
              </ThemedText>
            </View>
            <Pressable
              onPress={toggle}
              hitSlop={10}
              style={styles.miniBtn}
              accessibilityRole="button"
              accessibilityLabel={playing ? 'Pause' : 'Play'}>
              <ThemedText style={styles.miniBtnGlyph}>{playing ? '❚❚' : '▶'}</ThemedText>
            </Pressable>
            <Pressable
              onPress={closeAudio}
              hitSlop={10}
              style={styles.miniBtn}
              accessibilityRole="button"
              accessibilityLabel="Stop and close player">
              <ThemedText themeColor="textSecondary" style={styles.miniClose}>
                ✕
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      ) : null}

      {/* Full-screen player */}
      <Modal visible={isExpanded} animationType="slide" onRequestClose={() => setExpanded(false)}>
        <View style={[styles.full, { backgroundColor: theme.background }]}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.fullSafe}>
            <View style={styles.fullBar}>
              <Pressable
                onPress={() => setExpanded(false)}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Minimize player">
                <ThemedText style={styles.chevron}>⌄</ThemedText>
              </Pressable>
              <ThemedText
                type="smallBold"
                themeColor="textSecondary"
                style={styles.nowPlaying}
                accessibilityRole="header">
                NOW PLAYING
              </ThemedText>
              <Pressable onPress={closeAudio} hitSlop={12}>
                <ThemedText themeColor="textSecondary" style={styles.fullClose}>
                  ✕
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.fullBody}>
              <View style={[styles.fullArt, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                {track.artwork ? (
                  <Image source={{ uri: track.artwork }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                ) : (
                  <ThemedText themeColor="gold" style={styles.fullArtGlyph}>
                    ♪
                  </ThemedText>
                )}
              </View>

              <ThemedText style={styles.fullTitle}>{track.title}</ThemedText>
              {track.showName ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.fullShow}>
                  {track.showName}
                </ThemedText>
              ) : null}

              {/* Scrubber */}
              <Pressable
                style={styles.scrubHit}
                onLayout={(e) => {
                  scrubWidth.current = e.nativeEvent.layout.width;
                }}
                onPress={(e) => {
                  if (scrubWidth.current > 0 && duration > 0) {
                    const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / scrubWidth.current));
                    player.seekTo(ratio * duration).catch(() => {});
                  }
                }}>
                <View style={[styles.scrubTrack, { backgroundColor: theme.border }]}>
                  <View style={[styles.scrubFill, { width: `${progress * 100}%`, backgroundColor: theme.gold }]} />
                </View>
              </Pressable>
              <View style={styles.times}>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatClock(position)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {duration ? formatClock(duration) : '--:--'}
                </ThemedText>
              </View>

              {/* Transport */}
              <View style={styles.transport}>
                <Pressable onPress={() => skip(-15)} hitSlop={10} style={styles.skipBtn}>
                  <ThemedText style={styles.skipGlyph}>↺15</ThemedText>
                </Pressable>
                <Pressable
                  onPress={toggle}
                  style={[styles.playBtn, { backgroundColor: theme.gold }]}
                  accessibilityRole="button"
                  accessibilityLabel={playing ? 'Pause' : 'Play'}>
                  <ThemedText style={styles.playGlyph}>{playing ? '❚❚' : '▶'}</ThemedText>
                </Pressable>
                <Pressable onPress={() => skip(30)} hitSlop={10} style={styles.skipBtn}>
                  <ThemedText style={styles.skipGlyph}>30↻</ThemedText>
                </Pressable>
              </View>

              <Pressable onPress={cycleSpeed} style={[styles.speed, { borderColor: theme.border }]}>
                <ThemedText type="smallBold" themeColor="blue">
                  {SPEEDS[speedIdx]}×
                </ThemedText>
              </Pressable>

              {track.description ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.desc}>
                  {track.description}
                </ThemedText>
              ) : null}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  mini: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
    bottom: BottomTabInset + Spacing.one,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#00030b',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  miniProgress: { height: 2, width: '100%' },
  miniProgressFill: { height: 2 },
  miniRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2, padding: Spacing.two },
  miniArt: {
    width: 40,
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniArtGlyph: { fontSize: 18 },
  miniCopy: { flex: 1, minWidth: 0 },
  miniTitle: { fontSize: 13.5, fontWeight: '600', color: '#f3f6fa' },
  miniBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  miniBtnGlyph: { color: '#f3f6fa', fontSize: 14 },
  miniClose: { fontSize: 14 },

  full: { flex: 1 },
  fullSafe: { flex: 1 },
  fullBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  chevron: { color: '#f3f6fa', fontSize: 26, lineHeight: 26 },
  nowPlaying: { letterSpacing: 1 },
  fullClose: { fontSize: 18 },
  fullBody: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.six, alignItems: 'center', gap: Spacing.three },
  fullArt: {
    width: '86%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  fullArtGlyph: { fontSize: 64 },
  fullTitle: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 26,
    color: '#f3f6fa',
    textAlign: 'center',
  },
  fullShow: { textAlign: 'center' },
  scrubHit: { alignSelf: 'stretch', paddingVertical: Spacing.two },
  scrubTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  scrubFill: { height: 4 },
  times: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'space-between', marginTop: -Spacing.one },
  transport: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.five },
  skipBtn: { padding: Spacing.two },
  skipGlyph: { color: '#f3f6fa', fontSize: 15, fontWeight: '700' },
  playBtn: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  playGlyph: { color: '#0d1f3c', fontSize: 22 },
  speed: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one + 2 },
  desc: { alignSelf: 'stretch', lineHeight: 20, marginTop: Spacing.two },
});
