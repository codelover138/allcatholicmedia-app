import { useRouter } from 'expo-router';
import type { ReactElement } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListScreenProps<T> = {
  title: string;
  subtitle?: string;
  data: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => ReactElement;
  isLoading: boolean;
  isError: boolean;
  emptyMessage: string;
  onRetry?: () => void;
  onEndReached?: () => void;
  loadingMore?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export function ListScreen<T>({
  title,
  subtitle,
  data,
  keyExtractor,
  renderItem,
  isLoading,
  isError,
  emptyMessage,
  onRetry,
  onEndReached,
  loadingMore,
  onRefresh,
  refreshing,
}: ListScreenProps<T>) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Go back">
            <ThemedText style={styles.backGlyph}>‹ Back</ThemedText>
          </Pressable>
        </View>

        <FlatList
          data={data}
          keyExtractor={keyExtractor}
          renderItem={({ item }) => renderItem(item)}
          contentContainerStyle={styles.content}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          onRefresh={onRefresh}
          refreshing={refreshing ?? false}
          ListHeaderComponent={
            <View style={styles.head}>
              <ThemedText style={styles.title}>{title}</ThemedText>
              {subtitle ? (
                <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                  {subtitle}
                </ThemedText>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator color={theme.accent} />
              </View>
            ) : isError ? (
              <ErrorState message="Could not load this list." onRetry={onRetry} />
            ) : (
              <EmptyState message={emptyMessage} />
            )
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator color={theme.textSecondary} />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  topBar: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  backGlyph: { fontSize: 15, fontWeight: '600', color: '#f3f6fa' },
  content: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    flexGrow: 1,
  },
  head: { gap: Spacing.two, paddingTop: Spacing.two, paddingBottom: Spacing.three },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 32,
    color: '#f3f6fa',
  },
  subtitle: { fontSize: 14, lineHeight: 20 },
  sep: { height: Spacing.two + 2 },
  center: { paddingVertical: Spacing.six, alignItems: 'center' },
  footer: { paddingVertical: Spacing.four, alignItems: 'center' },
});
