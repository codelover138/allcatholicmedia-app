import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/lib/app-store';

export function VideoPlayerModal() {
  const theme = useTheme();
  const activeVideoUrl = useAppStore((state) => state.activeVideoUrl);
  const activeVideoTitle = useAppStore((state) => state.activeVideoTitle);
  const closeVideoModal = useAppStore((state) => state.closeVideoModal);

  if (!activeVideoUrl) return null;

  // Process embed URL (e.g. YouTube embed format)
  const embedUrl = activeVideoUrl.includes('youtube.com/watch?v=')
    ? activeVideoUrl.replace('watch?v=', 'embed/')
    : activeVideoUrl;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={closeVideoModal}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={closeVideoModal} />

        <ThemedView variant="elevated" style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <View style={[styles.liveTagPill, { backgroundColor: theme.accent }]}>
                <View style={styles.pulseDot} />
                <ThemedText type="badge" style={{ color: '#ffffff' }}>
                  PLAYER
                </ThemedText>
              </View>
              <ThemedText type="subtitle" numberOfLines={1} style={styles.title}>
                {activeVideoTitle || 'Live Stream / Video'}
              </ThemedText>
            </View>

            <Pressable
              onPress={closeVideoModal}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="close" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* Player Container */}
          <View style={styles.playerWrap}>
            {Platform.OS === 'web' ? (
              <iframe
                src={embedUrl}
                style={{ width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <WebView
                source={{ uri: embedUrl }}
                style={styles.webview}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
              />
            )}
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: Spacing.three,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  container: {
    width: '100%',
    maxWidth: 800,
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginRight: Spacing.two,
  },
  liveTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  playerWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
