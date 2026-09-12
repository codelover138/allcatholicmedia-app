import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/form';
import { EmptyState, ErrorState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, type CommentDTO } from '@/lib/app-content';
import { useAuth } from '@/lib/auth-store';
import { formatShortDate } from '@/lib/format';

type Props = {
  visible: boolean;
  kind: 'read' | 'saints';
  slug: string | undefined;
  onClose: () => void;
};

/** Comments on an article/saint page. Reads are public; posting needs sign-in. */
export function CommentsSheet({ visible, kind, slug, onClose }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const queryClient = useQueryClient();

  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const query = useInfiniteQuery({
    queryKey: ['comments', kind, slug],
    queryFn: ({ pageParam = 1 }) => appContentApi.comments(kind, slug!, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.pagination.has_more ? last.meta.pagination.current_page + 1 : undefined,
    enabled: visible && !!slug,
  });

  const comments = query.data?.pages.flatMap((p) => p.data) ?? [];

  const post = useMutation({
    mutationFn: () => appContentApi.postComment(kind, slug!, draft.trim()),
    onSuccess: (res) => {
      setDraft('');
      setNotice(
        res.data.pending
          ? 'Thanks — your comment is awaiting approval and will appear once reviewed.'
          : null,
      );
      void queryClient.invalidateQueries({ queryKey: ['comments', kind, slug] });
    },
  });

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: '#0f1830' }]}>
          <View style={styles.bar}>
            <ThemedText style={styles.title}>Comments</ThemedText>
            <Pressable onPress={onClose} hitSlop={14}>
              <ThemedText style={styles.close}>✕</ThemedText>
            </Pressable>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(c) => String(c.id)}
            contentContainerStyle={styles.list}
            onEndReachedThreshold={0.4}
            onEndReached={() => query.hasNextPage && query.fetchNextPage()}
            ListEmptyComponent={
              query.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator color={theme.accent} />
                </View>
              ) : query.isError ? (
                <ErrorState message="Could not load comments." onRetry={() => query.refetch()} />
              ) : (
                <EmptyState message="No comments yet — be the first to share a reflection." />
              )
            }
            ListFooterComponent={
              query.isFetchingNextPage ? (
                <View style={styles.center}>
                  <ActivityIndicator color={theme.textSecondary} />
                </View>
              ) : null
            }
            renderItem={({ item }) => <CommentRow comment={item} />}
          />

          {status === 'authed' ? (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              {notice ? (
                <ThemedText type="small" themeColor="gold" style={styles.notice}>
                  {notice}
                </ThemedText>
              ) : null}
              <View style={styles.composer}>
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Share a reflection…"
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { color: theme.text, borderColor: theme.border }]}
                  multiline
                />
                <Button
                  label="POST"
                  onPress={() => post.mutate()}
                  loading={post.isPending}
                  disabled={!draft.trim()}
                  style={styles.postButton}
                />
              </View>
            </KeyboardAvoidingView>
          ) : (
            <View style={styles.signInRow}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.signInText}>
                Sign in to join the conversation.
              </ThemedText>
              <Button label="SIGN IN" variant="secondary" onPress={() => router.push('/sign-in')} />
            </View>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function CommentRow({ comment }: { comment: CommentDTO }) {
  const theme = useTheme();
  return (
    <View style={styles.commentBlock}>
      <View style={styles.commentRow}>
        <View style={[styles.avatar, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText themeColor="gold" style={styles.avatarInitial}>
            {(comment.author_name ?? '?').trim().charAt(0).toUpperCase() || '?'}
          </ThemedText>
        </View>
        <View style={styles.commentBody}>
          <View style={styles.commentHead}>
            <ThemedText style={styles.author} numberOfLines={1}>
              {comment.author_name ?? 'Guest'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {formatShortDate(comment.created_at)}
            </ThemedText>
          </View>
          <ThemedText type="small" style={styles.content}>
            {comment.content}
          </ThemedText>
        </View>
      </View>
      {comment.replies?.map((reply) => (
        <View key={reply.id} style={styles.reply}>
          <CommentRow comment={reply} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { height: '80%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a3c60',
  },
  title: { fontSize: 17, fontWeight: '700', color: '#f3f6fa' },
  close: { fontSize: 18, color: '#f3f6fa' },
  list: { padding: Spacing.four, gap: Spacing.three, flexGrow: 1 },
  center: { paddingVertical: Spacing.five, alignItems: 'center' },
  commentBlock: { gap: Spacing.two },
  commentRow: { flexDirection: 'row', gap: Spacing.two + 2 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 13, fontWeight: '800' },
  commentBody: { flex: 1, minWidth: 0, gap: 2 },
  commentHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, justifyContent: 'space-between' },
  author: { fontSize: 13.5, fontWeight: '700', color: '#f3f6fa' },
  content: { lineHeight: 19 },
  reply: { marginLeft: 44, marginTop: Spacing.two },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a3c60',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two,
    fontSize: 14,
  },
  postButton: { minHeight: 40, paddingHorizontal: Spacing.three },
  notice: { paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  signInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#2a3c60',
  },
  signInText: { flex: 1 },
});
