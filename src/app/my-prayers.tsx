import { useInfiniteQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { accountApi, type MemberPrayerRequest } from '@/lib/auth-api';
import { formatShortDate } from '@/lib/format';

export default function MyPrayersScreen() {
  const query = useInfiniteQuery({
    queryKey: ['account', 'prayer-requests', 'list'],
    queryFn: ({ pageParam = 1 }) => accountApi.prayerRequests(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.pagination.has_more ? last.meta.pagination.current_page + 1 : undefined,
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <ListScreen<MemberPrayerRequest>
      title="My prayer requests"
      subtitle="Intentions you've entrusted to the community and the prayer team."
      data={items}
      keyExtractor={(p) => String(p.id)}
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={query.refetch}
      onRefresh={query.refetch}
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onEndReached={() => query.hasNextPage && query.fetchNextPage()}
      loadingMore={query.isFetchingNextPage}
      emptyMessage="You haven't submitted a prayer request yet."
      renderItem={(p) => <PrayerRow request={p} />}
    />
  );
}

const VIS_LABEL: Record<NonNullable<MemberPrayerRequest['visibility']>, string> = {
  only_me: 'ONLY ME',
  prayer_team: 'PRAYER TEAM',
  community: 'COMMUNITY',
};

function PrayerRow({ request }: { request: MemberPrayerRequest }) {
  const theme = useTheme();
  const visibility = request.visibility ?? (request.is_private ? 'prayer_team' : 'community');
  const isCommunity = visibility === 'community';
  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.rowTop}>
        <View style={[styles.pill, { borderColor: isCommunity ? theme.gold : theme.textSecondary }]}>
          <ThemedText
            style={[styles.pillText, { color: isCommunity ? theme.gold : theme.textSecondary }]}>
            {VIS_LABEL[visibility]}
          </ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {formatShortDate(request.created_at) ?? '—'}
        </ThemedText>
      </View>
      <ThemedText style={styles.intention} numberOfLines={4}>
        {request.intention}
      </ThemedText>
      {request.status ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.status}>
          {request.status[0].toUpperCase() + request.status.slice(1)}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, gap: Spacing.two },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 2 },
  pillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  intention: { fontSize: 14, lineHeight: 20, color: '#f3f6fa' },
  status: { marginTop: 2 },
});
