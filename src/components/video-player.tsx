import { useSyncExternalStore } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';

/** Pull the 11-char video id out of any YouTube watch / embed / short / youtu.be URL. */
export function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const match =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(
      input,
    );
  return match ? match[1] : null;
}

// ── Tiny module-level store, so `play()` works from anywhere without a React
//    context (Expo Router's native tabs don't reliably pass context to screens).
type Current = { id: string; title?: string } | null;
let current: Current = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => current;

export function playVideo(url: string | null | undefined, title?: string) {
  if (!url) return;
  const id = extractYouTubeId(url);
  if (!id) {
    Linking.openURL(url);
    return;
  }
  current = { id, title };
  emit();
}

export function closeVideo() {
  current = null;
  emit();
}

/** Hook form so screens keep calling `const { play } = useVideoPlayer()`. */
export function useVideoPlayer() {
  return { play: playVideo };
}

const embedUri = (id: string) =>
  `https://www.youtube.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&fs=1`;

/**
 * Renders the in-app player. Mount once at the app root (outside the tab
 * navigator) so the modal is never clipped by a tab scene.
 */
export function VideoPlayerHost() {
  const video = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <Modal
      visible={!!video}
      animationType="slide"
      onRequestClose={closeVideo}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.bar}>
          <Pressable onPress={closeVideo} hitSlop={14} style={styles.close}>
            <ThemedText style={styles.closeGlyph}>✕</ThemedText>
          </Pressable>
          <ThemedText style={styles.title} numberOfLines={1}>
            {video?.title ?? 'Now Playing'}
          </ThemedText>
          {video ? (
            <Pressable
              onPress={() => Linking.openURL(`https://youtu.be/${video.id}`)}
              hitSlop={12}>
              <ThemedText style={styles.openExternal}>YouTube ↗</ThemedText>
            </Pressable>
          ) : null}
        </SafeAreaView>

        {video ? (
          Platform.OS === 'web' ? (
            <View style={styles.web}>
              <iframe
                title={video.title ?? 'Video'}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
                src={embedUri(video.id)}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
              />
            </View>
          ) : (
            <WebView
              style={styles.web}
              source={{ uri: embedUri(video.id) }}
              originWhitelist={['*']}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
            />
          )
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  bar: {
    backgroundColor: '#000',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  close: { padding: 4 },
  closeGlyph: { color: '#fff', fontSize: 20, fontWeight: '700' },
  title: { flex: 1, color: '#e7ecf3', fontSize: 14, fontWeight: '600' },
  openExternal: { color: '#c9a227', fontSize: 12, fontWeight: '700' },
  web: { flex: 1, backgroundColor: '#000' },
});
