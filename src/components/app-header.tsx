import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AppHeader() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable onPress={() => router.push('/')} style={styles.wordmark}>
        <Image
          source={require('../../assets/images/catholic-media-logo.png')}
          style={styles.logoImage}
          contentFit="contain"
        />
        <View style={styles.sublineWrap}>
          <ThemedText themeColor="gold" style={styles.brandSubtitle}>
            FR. MORSIN LIVINGSTON
          </ThemedText>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push('/live')}
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && styles.pressed,
          ]}>
          <View style={[styles.liveDot, { backgroundColor: theme.live }]} />
          <ThemedText type="badge" style={{ color: theme.live, fontSize: 10, fontWeight: '700' }}>
            LIVE
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => router.push('/explore')}
          style={({ pressed }) => [
            styles.iconBtn,
            pressed && styles.pressed,
          ]}>
          <Ionicons name="search" size={16} color={theme.gold} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#1F273D',
    backgroundColor: '#0A0F1D',
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoImage: {
    width: 146,
    height: 32,
  },
  sublineWrap: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(212, 175, 55, 0.35)',
    paddingLeft: Spacing.oneHalf,
    justifyContent: 'center',
  },
  brandSubtitle: {
    fontSize: 8.5,
    lineHeight: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#2A3452',
    backgroundColor: '#141A2E',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#2A3452',
    backgroundColor: '#141A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
