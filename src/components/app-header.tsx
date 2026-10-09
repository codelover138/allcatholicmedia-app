import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AppHeader() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.header, { borderBottomColor: theme.border, backgroundColor: theme.glass }]}>
      <Pressable onPress={() => router.push('/')} style={styles.wordmark}>
        <View style={[styles.emblem, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
          <ThemedText themeColor="gold" style={styles.emblemCross}>
            ✝
          </ThemedText>
        </View>
        <View style={styles.titleGroup}>
          <ThemedText style={styles.brandTitle}>
            All Catholic Media
          </ThemedText>
          <ThemedText themeColor="gold" style={styles.brandSubtitle}>
            FR. MORSON LIVINGSTON
          </ThemedText>
        </View>
      </Pressable>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push('/live')}
          style={({ pressed }) => [
            styles.actionBtn,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}>
          <View style={[styles.liveDot, { backgroundColor: theme.live }]} />
          <ThemedText type="badge" style={{ color: theme.live, fontSize: 10 }}>
            LIVE
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={() => router.push('/explore')}
          style={({ pressed }) => [
            styles.iconBtn,
            { borderColor: theme.border, backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}>
          <Ionicons name="search" size={16} color={theme.textSecondary} />
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
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  emblem: {
    width: 34,
    height: 34,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemCross: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
  titleGroup: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
});
