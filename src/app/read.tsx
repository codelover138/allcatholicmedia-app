import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';
import { appContentApi, type ArticleDTO } from '@/lib/app-content';

export default function ReadScreen() {
  const readQuery = useQuery({
    queryKey: ['app', 'read'],
    queryFn: () => appContentApi.read(),
  });

  const articles = readQuery.data?.data.articles ?? [];

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: 'transparent' }]}>
      <ThemedText type="title" style={styles.title}>
        Read
      </ThemedText>

      {readQuery.isLoading ? <LoadingState /> : null}
      {readQuery.isError ? (
        <ErrorState
          message={
            readQuery.error instanceof Error ? readQuery.error.message : 'Could not load articles.'
          }
          onRetry={() => readQuery.refetch()}
        />
      ) : null}
      {readQuery.data && articles.length === 0 ? <EmptyState message="No articles yet." /> : null}

      {articles.length > 0 ? (
        <FlatList
          data={articles}
          keyExtractor={(article) => String(article.id)}
          contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.four }}
          refreshControl={
            <RefreshControl refreshing={readQuery.isRefetching} onRefresh={() => readQuery.refetch()} />
          }
          renderItem={({ item }) => <ArticleRow article={item} />}
        />
      ) : null}
    </SafeAreaView>
    </ScreenBackground>
  );
}

function ArticleRow({ article }: { article: ArticleDTO }) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      {article.image ? (
        <Image source={{ uri: article.image }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={styles.thumbPlaceholder} />
      )}
      <ThemedView style={styles.rowBody}>
        <ThemedText type="default" numberOfLines={2}>
          {article.title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {article.categories.map((c) => c.name).join(', ')}
        </ThemedText>
      </ThemedView>
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
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.two,
    padding: Spacing.two,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: Spacing.two,
  },
  thumbPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: Spacing.two,
    backgroundColor: 'rgba(169,129,47,0.25)',
  },
});
