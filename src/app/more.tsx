import { useQuery } from '@tanstack/react-query';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { appContentApi, type ArticleDTO } from '@/lib/app-content';

const COMING_SOON = [
  { key: 'prayer', label: 'Prayer Request' },
  { key: 'donate', label: 'Donate' },
  { key: 'account', label: 'Sign in / Account' },
  { key: 'settings', label: 'Settings' },
];

export default function MoreScreen() {
  const saintsQuery = useQuery({
    queryKey: ['app', 'saints'],
    queryFn: () => appContentApi.saints(),
  });

  const saints = saintsQuery.data?.data.saints ?? [];

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: 'transparent' }]}>
      <ThemedText type="title" style={styles.title}>
        More
      </ThemedText>

      <ThemedText type="smallBold" themeColor="gold" style={styles.sectionHeader}>
        SAINTS & CALENDAR
      </ThemedText>
      {saintsQuery.isLoading ? <LoadingState /> : null}
      {saintsQuery.isError ? (
        <ErrorState message="Could not load saints." onRetry={() => saintsQuery.refetch()} />
      ) : null}
      {saintsQuery.data && saints.length === 0 ? <EmptyState message="No saints listed yet." /> : null}

      {saints.length > 0 ? (
        <FlatList
          data={saints}
          keyExtractor={(saint) => String(saint.id)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.saintsList}
          renderItem={({ item }) => <SaintCard saint={item} />}
        />
      ) : null}

      <ThemedText type="smallBold" themeColor="gold" style={styles.sectionHeader}>
        MORE
      </ThemedText>
      <ThemedView style={{ paddingBottom: BottomTabInset + Spacing.four }}>
        {COMING_SOON.map((item) => (
          <ThemedView key={item.key} type="backgroundElement" style={styles.linkRow}>
            <ThemedText type="default">{item.label}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Coming soon
            </ThemedText>
          </ThemedView>
        ))}
      </ThemedView>
    </SafeAreaView>
    </ScreenBackground>
  );
}

function SaintCard({ saint }: { saint: ArticleDTO }) {
  return (
    <ThemedView type="backgroundElement" style={styles.saintCard}>
      <ThemedText type="default" numberOfLines={2} style={styles.saintName}>
        {saint.title}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  sectionHeader: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    letterSpacing: 1,
  },
  saintsList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  saintCard: {
    width: 120,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    justifyContent: 'flex-end',
    minHeight: 96,
  },
  saintName: {
    textAlign: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
