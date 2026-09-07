import { useInfiniteQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';

import { ListScreen } from '@/components/list-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { accountApi, type Donation } from '@/lib/auth-api';
import { formatShortDate } from '@/lib/format';

const STATUS_TONE: Record<string, 'success' | 'muted' | 'danger'> = {
  completed: 'success',
  succeeded: 'success',
  paid: 'success',
  pending: 'muted',
  processing: 'muted',
  failed: 'danger',
  refunded: 'danger',
  cancelled: 'danger',
};

export default function GivingScreen() {
  const query = useInfiniteQuery({
    queryKey: ['account', 'donations', 'list'],
    queryFn: ({ pageParam = 1 }) => accountApi.donations(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.pagination.has_more ? last.meta.pagination.current_page + 1 : undefined,
  });

  const items = query.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <ListScreen<Donation>
      title="Giving history"
      subtitle="Thank you for supporting the mission. Your receipts are listed here."
      data={items}
      keyExtractor={(d) => String(d.id)}
      isLoading={query.isLoading}
      isError={query.isError}
      onRetry={query.refetch}
      onRefresh={query.refetch}
      refreshing={query.isRefetching && !query.isFetchingNextPage}
      onEndReached={() => query.hasNextPage && query.fetchNextPage()}
      loadingMore={query.isFetchingNextPage}
      emptyMessage="You haven't made a gift yet. Every gift supports Fr. Morson's ministry."
      renderItem={(d) => <GivingRow donation={d} />}
    />
  );
}

function GivingRow({ donation }: { donation: Donation }) {
  const theme = useTheme();
  const tone = STATUS_TONE[donation.status?.toLowerCase()] ?? 'muted';
  const toneColor =
    tone === 'success' ? theme.success : tone === 'danger' ? theme.danger : theme.textSecondary;

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.rowTop}>
        <ThemedText style={styles.amount}>{donation.formatted_amount}</ThemedText>
        <View style={[styles.statusPill, { borderColor: toneColor }]}>
          <ThemedText style={[styles.statusText, { color: toneColor }]}>
            {donation.status?.toUpperCase() || 'RECORDED'}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {formatShortDate(donation.created_at) ?? '—'}
      </ThemedText>
      {donation.message ? (
        <ThemedText type="small" style={styles.message} numberOfLines={2}>
          “{donation.message}”
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, gap: Spacing.one + 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  amount: { fontFamily: 'Georgia', fontWeight: '700', fontSize: 18, color: '#f3f6fa' },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  message: { fontStyle: 'italic', lineHeight: 18, marginTop: 2 },
});
