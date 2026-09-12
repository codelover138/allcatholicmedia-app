import { useState, useSyncExternalStore } from 'react';
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
    // Fall back to opening a non-YouTube video URL externally — but only http(s),
    // never an arbitrary scheme that could come through in API data.
    if (/^https?:\/\//i.test(url)) Linking.openURL(url);
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

const YT_ORIGIN = 'https://www.youtube.com';
// YouTube needs the installed app's identity as the WebView document origin.
// A youtube.com base URL identifies the embed as YouTube itself and can fail
// with player error 153 (missing client identification).
const APP_ORIGIN = 'https://com.allcatholicmedia.mainapp';

const embedUri = (id: string, origin?: string) =>
  `${YT_ORIGIN}/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&fs=1` +
  (origin ? `&origin=${encodeURIComponent(origin)}` : '');

// Native player. Built on the YouTube IFrame Player API rather than a bare
// <iframe src=".../embed/..."> because the API (a) creates the player with a
// matching app origin and gives us `onError` so a video that truly can't be
// embedded can be reported in the modal. The WebView base URL supplies the
// app identity in the Referer header sent to YouTube.
const playerHtml = (id: string) => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#player{width:100%;height:100%;background:#000;overflow:hidden}
</style>
</head>
<body>
<div id="player"></div>
<script>
  function post(msg){ try { window.ReactNativeWebView.postMessage(JSON.stringify(msg)); } catch (e) {} }
  var tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  tag.onerror = function(){ post({ type: 'error', code: 'api' }); };
  document.body.appendChild(tag);
  function onYouTubeIframeAPIReady(){
    new YT.Player('player', {
      videoId: ${JSON.stringify(id)},
      playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, fs: 1, origin: ${JSON.stringify(
        APP_ORIGIN,
      )} },
      events: {
        onReady: function(e){ try { e.target.playVideo(); } catch (err) {} },
        onError: function(e){ post({ type: 'error', code: e && e.data }); }
      }
    });
  }
</script>
</body>
</html>`;

/**
 * Renders the in-app player. Mount once at the app root (outside the tab
 * navigator) so the modal is never clipped by a tab scene.
 */
export function VideoPlayerHost() {
  const video = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [playbackError, setPlaybackError] = useState<{ id: string; message: string } | null>(null);
  const error = playbackError && playbackError.id === video?.id ? playbackError.message : null;
  const fail = (message: string) => {
    if (video) setPlaybackError({ id: video.id, message });
  };

  const dismiss = () => {
    setPlaybackError(null);
    closeVideo();
  };

  return (
    <Modal
      visible={!!video}
      animationType="slide"
      onRequestClose={dismiss}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.bar}>
          <Pressable onPress={dismiss} hitSlop={14} style={styles.close}>
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
          ) : error ? (
            <View style={styles.errorPane}>
              <ThemedText style={styles.errorText}>{error}</ThemedText>
              <Pressable onPress={() => Linking.openURL(`https://youtu.be/${video.id}`)}>
                <ThemedText style={styles.openExternal}>Watch on YouTube ↗</ThemedText>
              </Pressable>
            </View>
          ) : (
            <WebView
              key={video.id}
              style={styles.web}
              source={{ html: playerHtml(video.id), baseUrl: `${APP_ORIGIN}/` }}
              originWhitelist={['*']}
              allowsInlineMediaPlayback
              allowsPictureInPictureMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              // Keep every request the player makes inside the WebView. The only
              // thing sent out to the system browser is an explicit tap on the
              // player's own "Watch on YouTube" link (a top-frame navigation to
              // a watch/shorts page) — normal playback never navigates.
              onShouldStartLoadWithRequest={(req) => {
                const leavingToWatchPage =
                  req.isTopFrame &&
                  /^https?:\/\/(www\.)?(youtube\.com\/(watch\?|shorts\/)|youtu\.be\/)/.test(req.url);
                if (leavingToWatchPage) {
                  fail('This video cannot play inside the app.');
                  return false;
                }
                return true;
              }}
              onMessage={(e) => {
                try {
                  const msg = JSON.parse(e.nativeEvent.data);
                  if (msg?.type === 'error') {
                    fail(msg.code === 101 || msg.code === 150
                      ? 'The video owner does not allow playback inside apps.'
                      : 'This video could not play inside the app.');
                  }
                } catch {}
              }}
              onError={() => {
                fail('This video could not load inside the app.');
              }}
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
  errorPane: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  errorText: { color: '#e7ecf3', textAlign: 'center', fontSize: 15 },
});
