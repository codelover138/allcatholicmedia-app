import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, type HomeSection } from '@/lib/app-content';

const SECTION_HREF: Record<string, string> = {
  channels: '/live',
  live_now: '/live',
  listen: '/listen',
  read: '/read',
  saints: '/more',
  donate: '/more',
  prayer_requests: '/more',
};

export default function HomeScreen() {
  const theme = useTheme();

  const homeQuery = useQuery({
    queryKey: ['app', 'home'],
    queryFn: appContentApi.home,
  });

  const liveNowQuery = useQuery({
    queryKey: ['app', 'live-now'],
    queryFn: appContentApi.liveNow,
  });

  const liveStream = liveNowQuery.data?.data.live_now[0];

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={homeQuery.isRefetching} onRefresh={() => homeQuery.refetch()} />
      }>
      <SafeAreaView edges={['top']} style={{ paddingBottom: BottomTabInset + Spacing.three }}>
        <ThemedView style={styles.header}>
          <ThemedText type="small" themeColor="gold" style={styles.eyebrow}>
            Fr. Morson Livingston
          </ThemedText>
          <ThemedText type="title" style={styles.title}>
            Today
          </ThemedText>
        </ThemedView>

        {liveStream ? (
          <Link href="/live" asChild>
            <Pressable>
              <ThemedView style={[styles.liveBanner, { backgroundColor: theme.accent }]}>
                <ThemedText type="small" style={styles.liveTag}>
                  ● Live now
                </ThemedText>
                <ThemedText type="subtitle" style={styles.liveTitle}>
                  {liveStream.title}
                </ThemedText>
                {liveStream.source_name ? (
                  <ThemedText type="small" style={styles.liveSource}>
                    {liveStream.source_name}
                  </ThemedText>
                ) : null}
              </ThemedView>
            </Pressable>
          </Link>
        ) : null}

        {homeQuery.isLoading ? <LoadingState /> : null}
        {homeQuery.isError ? (
          <ErrorState
            message={
              homeQuery.error instanceof Error ? homeQuery.error.message : 'Could not load home.'
            }
            onRetry={() => homeQuery.refetch()}
          />
        ) : null}
        {homeQuery.data && homeQuery.data.data.sections.length === 0 ? (
          <EmptyState message="Nothing to show yet." />
        ) : null}

        {homeQuery.data ? (
          <ThemedView style={styles.sections}>
            {homeQuery.data.data.sections.map((section) => (
              <SectionCard key={section.key} section={section} />
            ))}
          </ThemedView>
        ) : null}
      </SafeAreaView>
    </ScrollView>
  );
}

function SectionCard({ section }: { section: HomeSection }) {
  const href = SECTION_HREF[section.key] ?? '/more';

  return (
    <Link href={href as never} asChild>
      <Pressable>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle" style={styles.cardTitle}>
            {section.title}
          </ThemedText>
          {typeof section.count === 'number' ? (
            <ThemedText type="small" themeColor="textSecondary">
              {section.count} available
            </ThemedText>
          ) : null}
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
  },
  eyebrow: {
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
  },
  liveBanner: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.half,
  },
  liveTag: {
    color: '#fff5f0',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  liveTitle: {
    color: '#fff5f0',
  },
  liveSource: {
    color: '#fff5f0',
    opacity: 0.85,
  },
  sections: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.half,
  },
  cardTitle: {
    fontSize: 19,
  },
});
