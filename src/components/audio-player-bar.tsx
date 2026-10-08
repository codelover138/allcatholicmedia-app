import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAppStore } from '@/lib/app-store';

export function AudioPlayerBar() {
  const theme = useTheme();
  const currentTrack = useAppStore((state) => state.currentTrack);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const pauseTrack = useAppStore((state) => state.pauseTrack);
  const resumeTrack = useAppStore((state) => state.resumeTrack);
  const stopTrack = useAppStore((state) => state.stopTrack);

  if (!currentTrack) return null;

  return (
    <View style={styles.outerContainer}>
      <ThemedView variant="elevated" style={[styles.playerCard, { borderColor: theme.accentSoft }]}>
        <View style={styles.trackInfoRow}>
          {currentTrack.artwork ? (
            <Image source={{ uri: currentTrack.artwork }} style={styles.artwork} contentFit="cover" />
          ) : (
            <View style={[styles.artworkPlaceholder, { backgroundColor: theme.accentLight }]}>
              <Ionicons name="headset" size={20} color={theme.accent} />
            </View>
          )}

          <View style={styles.textWrap}>
            <ThemedText type="smallBold" numberOfLines={1} style={styles.trackTitle}>
              {currentTrack.title}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {currentTrack.showName}
            </ThemedText>
          </View>

          {/* Action Buttons */}
          <View style={styles.controlsRow}>
            <Pressable
              onPress={isPlaying ? pauseTrack : resumeTrack}
              style={({ pressed }) => [
                styles.playBtn,
                { backgroundColor: theme.accent },
                pressed && { opacity: 0.8 },
              ]}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#ffffff" />
            </Pressable>

            <Pressable
              onPress={stopTrack}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Progress Bar visual indicator */}
        <View style={[styles.progressBarBg, { backgroundColor: theme.borderLight }]}>
          <View style={[styles.progressBarFill, { backgroundColor: theme.accent }]} />
        </View>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: BottomTabInset + Spacing.two,
    left: Spacing.three,
    right: Spacing.three,
    alignItems: 'center',
    zIndex: 999,
  },
  playerCard: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderRadius: Radius.large,
    overflow: 'hidden',
    borderWidth: 1,
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.one,
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.two,
  },
  artwork: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
  },
  artworkPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  progressBarBg: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '45%',
    height: '100%',
    borderRadius: 2,
  },
});
