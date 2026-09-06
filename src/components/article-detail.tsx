import { useQuery } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { Linking, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { ErrorState, LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { appContentApi, slugFromUrl, type PostDetailDTO } from '@/lib/app-content';

type Kind = 'read' | 'saints';
type Current = { kind: Kind; slug: string; title?: string; url?: string } | null;

let current: Current = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => current;

/** `ref` may be a slug or a full ACM blog URL. */
export function openArticle(kind: Kind, ref: string | null | undefined, title?: string) {
  if (!ref) return;
  const isUrl = /^https?:\/\//i.test(ref);
  const slug = isUrl ? slugFromUrl(ref) : ref;
  if (!slug) return;
  current = { kind, slug, title, url: isUrl ? ref : undefined };
  emit();
}

export function closeArticle() {
  current = null;
  emit();
}

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string,
  );
}

function buildHtml(d: PostDetailDTO): string {
  const category = d.categories?.[0]?.name ?? '';
  const date = d.published_at
    ? new Date(d.published_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';
  const hero = d.image_full ?? d.image;
  const meta = [category, date].filter(Boolean).map(escapeHtml).join(' &middot; ');

  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>
  :root { color-scheme: dark; }
  html, body { margin: 0; }
  body {
    padding: 20px 20px 48px;
    background: #0f1830;
    color: #e7ecf3;
    font: 16px/1.7 -apple-system, system-ui, "Segoe UI", Roboto, sans-serif;
    -webkit-text-size-adjust: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }
  img { max-width: 100%; height: auto; border-radius: 10px; margin: 14px 0; display: block; }
  img.hero { margin: 0 0 18px; }
  h1 { font-family: Georgia, "Times New Roman", serif; font-size: 25px; line-height: 1.3; color: #f3f6fa; margin: 0 0 8px; }
  h2, h3, h4, h5, h6 { font-family: Georgia, serif; color: #f3f6fa; line-height: 1.35; margin: 24px 0 8px; }
  p { margin: 0 0 14px; }
  a { color: #c9a227; }
  blockquote { margin: 16px 0; padding: 4px 0 4px 16px; border-left: 3px solid #c9a227; color: #cdd6e4; }
  .meta { color: #b9c4d6; font-size: 13px; letter-spacing: .02em; text-transform: uppercase; margin: 0 0 20px; }
  iframe { max-width: 100%; border: 0; border-radius: 10px; margin: 14px 0; }
  .acm-content-source { color: #b9c4d6; font-size: 13px; border-top: 1px solid #45618f; margin-top: 28px; padding-top: 14px; text-transform: none; letter-spacing: 0; }
</style></head><body>
${hero ? `<img class="hero" src="${escapeHtml(hero)}" alt="">` : ''}
<h1>${escapeHtml(d.title)}</h1>
${meta ? `<div class="meta">${meta}</div>` : ''}
${d.content ?? ''}
</body></html>`;
}

/** Mount once at the app root (outside the tab navigator). */
export function ArticleDetailHost() {
  const cur = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const query = useQuery({
    queryKey: ['article-detail', cur?.kind, cur?.slug],
    queryFn: () =>
      cur!.kind === 'saints'
        ? appContentApi.saintDetail(cur!.slug)
        : appContentApi.articleDetail(cur!.slug),
    enabled: !!cur,
    staleTime: 1000 * 60 * 10,
  });

  const detail = query.data?.data;
  const heading =
    detail?.title ?? cur?.title ?? (cur?.kind === 'saints' ? 'Saint' : 'Article');
  const externalUrl = detail?.url ?? cur?.url;

  return (
    <Modal
      visible={!!cur}
      animationType="slide"
      onRequestClose={closeArticle}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.bar}>
          <Pressable onPress={closeArticle} hitSlop={14} style={styles.close}>
            <ThemedText style={styles.closeGlyph}>✕</ThemedText>
          </Pressable>
          <ThemedText style={styles.title} numberOfLines={1}>
            {heading}
          </ThemedText>
          {externalUrl ? (
            <Pressable onPress={() => Linking.openURL(externalUrl)} hitSlop={12}>
              <ThemedText style={styles.openExternal}>Web ↗</ThemedText>
            </Pressable>
          ) : null}
        </SafeAreaView>

        {!cur ? null : query.isLoading ? (
          <LoadingState />
        ) : query.isError || !detail ? (
          <ErrorState message="Could not load this page." onRetry={() => query.refetch()} />
        ) : Platform.OS === 'web' ? (
          <View style={styles.body}>
            <iframe
              title={heading}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              srcDoc={buildHtml(detail)}
            />
          </View>
        ) : (
          <WebView
            style={styles.body}
            originWhitelist={['*']}
            source={{ html: buildHtml(detail), baseUrl: 'https://allcatholicmedia.com/' }}
            onShouldStartLoadWithRequest={(req) => {
              if (req.navigationType === 'click' && /^https?:\/\//i.test(req.url)) {
                Linking.openURL(req.url);
                return false;
              }
              return true;
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0f1830' },
  bar: {
    backgroundColor: '#0b1428',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2a3c60',
  },
  close: { padding: 4 },
  closeGlyph: { color: '#f3f6fa', fontSize: 20, fontWeight: '700' },
  title: { flex: 1, color: '#e7ecf3', fontSize: 14, fontWeight: '600' },
  openExternal: { color: '#c9a227', fontSize: 12, fontWeight: '700' },
  body: { flex: 1, backgroundColor: '#0f1830' },
});
