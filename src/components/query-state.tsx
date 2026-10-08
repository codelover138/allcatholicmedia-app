import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function LoadingState({ message = 'Loading content...' }: { message?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ThemedView variant="elevated" style={styles.cardContainer}>
        <ActivityIndicator size="small" color={theme.accent} style={{ marginBottom: Spacing.two }} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          {message}
        </ThemedText>
      </ThemedView>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ThemedView variant="elevated" style={styles.cardContainer}>
        <View style={[styles.iconBadge, { backgroundColor: theme.accentLight }]}>
          <Ionicons name="alert-circle-outline" size={24} color={theme.accent} />
        </View>
        <ThemedText type="smallBold" style={styles.centerText}>
          Something went wrong
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          {message}
        </ThemedText>
        {onRetry ? (
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: theme.accent },
              pressed && { opacity: 0.8 },
            ]}>
            <Ionicons name="refresh-outline" size={14} color="#ffffff" />
            <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
              Try Again
            </ThemedText>
          </Pressable>
        ) : null}
      </ThemedView>
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <View style={styles.center}>
      <ThemedView variant="outlined" style={styles.cardContainer}>
        <View style={[styles.iconBadge, { backgroundColor: theme.goldSoft }]}>
          <Ionicons name="cube-outline" size={24} color={theme.gold} />
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          {message}
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    borderRadius: Radius.large,
    gap: Spacing.two,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  centerText: {
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    marginTop: Spacing.two,
  },
});

