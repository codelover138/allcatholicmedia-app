import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { CatholicImagePlaceholder } from '@/components/catholic-image-placeholder';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, slugFromUrl, type ArticleDTO, resolveImageUrl } from '@/lib/app-content';
import { useAppStore } from '@/lib/app-store';

type ArticleDetailModalProps = {
  article: ArticleDTO | null;
  onClose: () => void;
};

const DEFAULT_MODAL_HERO = 'https://images.unsplash.com/photo-1548625361-180800b55a30?auto=format&fit=crop&w=800&q=80';

function cleanHtmlText(html?: string | null): string | null {
  if (!html) return null;
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function ArticleDetailModal({ article, onClose }: ArticleDetailModalProps) {
  const theme = useTheme();
  const toggleSaveItem = useAppStore((state) => state.toggleSaveItem);
  const isItemSaved = useAppStore((state) => state.isItemSaved);
  const playTrack = useAppStore((state) => state.playTrack);

  const [fontSize, setFontSize] = useState<number>(16);

  const isSaint =
    article?.categories?.some((c) => c.name.toLowerCase().includes('saint')) ||
    article?.url?.includes('/saints/');
  const slug = (article as any)?.slug || (article?.url ? slugFromUrl(article.url) : null);

  const detailQuery = useQuery({
    queryKey: ['article-detail-modal', isSaint ? 'saint' : 'read', slug],
    queryFn: () => {
      if (!slug) return null;
      return isSaint ? appContentApi.saintDetail(slug) : appContentApi.articleDetail(slug);
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  });

  if (!article) return null;

  const isSaved = isItemSaved(String(article.id), 'article');
  const categoryNames = article.categories?.map((c) => c.name).join(' · ') || 'Spiritual Reflection';
  const resolved = resolveImageUrl(article.image);
  const heroImageUrl =
    resolved &&
    (resolved.startsWith('http://') || resolved.startsWith('https://')) &&
    !resolved.includes('localhost') &&
    !resolved.includes('10.0.2.2')
      ? resolved
      : DEFAULT_MODAL_HERO;

  const rawContent = detailQuery.data?.data?.content;
  const parsedContent = cleanHtmlText(rawContent);

  const handleToggleBookmark = () => {
    toggleSaveItem({
      id: String(article.id),
      type: 'article',
      title: article.title,
      subtitle: categoryNames,
      image: article.image || undefined,
      url: article.url,
    });
  };

  const handlePlayAudioReflection = () => {
    playTrack({
      id: `article-audio-${article.id}`,
      title: article.title,
      showName: 'Fr. Morsin Livingston Homilies',
      audioUrl: article.url || 'https://allcatholicmedia.com/api/app/read',
      artwork: article.image || undefined,
      duration: '06:30',
    });
  };

  return (
    <Modal
      visible={Boolean(article)}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.scrim} onPress={onClose} />

        <ThemedView variant="elevated" style={styles.container}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerBadgeWrap}>
              <View style={[styles.categoryPill, { backgroundColor: theme.accentLight }]}>
                <ThemedText type="badge" themeColor="accent" numberOfLines={1}>
                  {categoryNames}
                </ThemedText>
              </View>
            </View>

            {/* Font Adjuster & Actions */}
            <View style={styles.headerActions}>
              <View style={[styles.fontToggleGroup, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <Pressable
                  onPress={() => setFontSize((prev) => Math.max(14, prev - 2))}
                  style={({ pressed }) => [styles.fontBtn, pressed && styles.pressed]}>
                  <ThemedText type="badge" themeColor="textSecondary">
                    A-
                  </ThemedText>
                </Pressable>
                <View style={[styles.fontDivider, { backgroundColor: theme.border }]} />
                <Pressable
                  onPress={() => setFontSize((prev) => Math.min(22, prev + 2))}
                  style={({ pressed }) => [styles.fontBtn, pressed && styles.pressed]}>
                  <ThemedText type="badge" themeColor="textSecondary">
                    A+
                  </ThemedText>
                </Pressable>
              </View>

              {article.url ? (
                <Pressable
                  onPress={() => Linking.openURL(article.url)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="open-outline" size={17} color={theme.accent} />
                </Pressable>
              ) : null}

              <Pressable
                onPress={handleToggleBookmark}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={isSaved ? theme.gold : theme.textSecondary}
                />
              </Pressable>

              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="close" size={18} color={theme.text} />
              </Pressable>
            </View>
          </View>

          {/* Reader Body Content */}
          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollInner}>
            <View style={styles.modalHeroWrap}>
              <CatholicImagePlaceholder style={StyleSheet.absoluteFill} title={article.title} iconName="book" />
              <Image source={{ uri: heroImageUrl }} style={styles.heroImage} contentFit="cover" transition={200} />
            </View>

            <ThemedText type="heroTitle" style={styles.articleTitle}>
              {article.title}
            </ThemedText>

            {/* Author & Publication Metadata */}
            <View style={styles.metaCard}>
              <View style={[styles.authorAvatar, { backgroundColor: theme.goldSoft }]}>
                <Ionicons name="person" size={16} color={theme.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold" themeColor="text">
                  Fr. Morsin Livingston Ministry
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {article.published_at
                    ? new Date(article.published_at).toLocaleDateString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'All Catholic Media Editorial'}
                </ThemedText>
              </View>

              <Pressable
                onPress={handlePlayAudioReflection}
                style={({ pressed }) => [
                  styles.audioListenPill,
                  { backgroundColor: theme.accentLight, borderColor: theme.accentSoft },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="headset" size={14} color={theme.accent} />
                <ThemedText type="badge" style={{ color: theme.accent }}>
                  Listen Audio
                </ThemedText>
              </Pressable>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.borderLight }]} />

            {/* Reflection Main Text */}
            <View style={styles.articleTextWrap}>
              <ThemedText
                type="default"
                style={[
                  styles.articleBodyText,
                  { fontSize, lineHeight: Math.round(fontSize * 1.6) },
                ]}>
                {parsedContent ||
                  article.description ||
                  `In today's holy reflection, Fr. Morsin Livingston reminds us of the profound peace and strength found in daily prayer and scripture meditation. As Catholics, we are called to live as beacons of faith, hope, and charity in our communities.

Let us draw near to the sacraments and open our hearts to the grace of the Holy Spirit each day. Through faithful perseverance, we transform our daily labor into prayerful offering to God.`}
              </ThemedText>
            </View>

            {/* Bottom Actions */}
            <View style={styles.bottomBar}>
              <Pressable
                onPress={handleToggleBookmark}
                style={({ pressed }) => [
                  styles.bookmarkFullBtn,
                  { backgroundColor: isSaved ? theme.goldSoft : theme.accent },
                  pressed && { opacity: 0.85 },
                ]}>
                <Ionicons
                  name={isSaved ? 'bookmark' : 'bookmark-outline'}
                  size={16}
                  color={isSaved ? theme.gold : '#ffffff'}
                />
                <ThemedText
                  type="smallBold"
                  style={{ color: isSaved ? theme.gold : '#ffffff' }}>
                  {isSaved ? 'Saved in Bookmarks' : 'Save Reflection'}
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scrim: {
    flex: 1,
    width: '100%',
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    maxHeight: '92%',
    height: '86%',
    borderTopLeftRadius: Radius.xlarge,
    borderTopRightRadius: Radius.xlarge,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerBadgeWrap: {
    flex: 1,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  fontToggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  fontBtn: {
    paddingHorizontal: Spacing.oneHalf,
    paddingVertical: 2,
  },
  fontDivider: {
    width: 1,
    height: 12,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    flex: 1,
  },
  scrollInner: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeroWrap: {
    position: 'relative',
    width: '100%',
    height: 220,
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderRadius: Radius.large,
  },
  articleTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  metaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioListenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.one,
  },
  articleTextWrap: {
    paddingVertical: Spacing.one,
  },
  articleBodyText: {
    fontSize: 16,
    lineHeight: 26,
  },
  bottomBar: {
    marginTop: Spacing.three,
  },
  bookmarkFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.full,
  },
  pressed: {
    opacity: 0.8,
  },
});
