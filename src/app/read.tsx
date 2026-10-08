import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArticleDetailModal } from '@/components/article-detail-modal';
import { CatholicImagePlaceholder } from '@/components/catholic-image-placeholder';
import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, resolveImageUrl, type ArticleCategoryDTO, type ArticleDTO } from '@/lib/app-content';

const CATHOLIC_ARTWORK_IMAGES = [
  'https://images.unsplash.com/photo-1548625361-180800b55a30?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1509021436468-d02aa3d51100?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1519817650390-64a93db51146?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1510936150000-30f705786000?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&w=800&q=80',
];

function getArticleImage(article: ArticleDTO): string {
  const resolved = resolveImageUrl(article.image);
  if (
    resolved &&
    (resolved.startsWith('http://') || resolved.startsWith('https://')) &&
    !resolved.includes('localhost') &&
    !resolved.includes('127.0.0.1') &&
    !resolved.includes('10.0.2.2')
  ) {
    return resolved;
  }
  const fallbackIndex = Math.abs(article.id || 0) % CATHOLIC_ARTWORK_IMAGES.length;
  return CATHOLIC_ARTWORK_IMAGES[fallbackIndex];
}

function SafeArticleImage({
  uri,
  fallbackUri,
  style,
  iconName = 'book',
  compact = false,
}: {
  uri?: string | null;
  fallbackUri?: string | null;
  style: any;
  iconName?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
}) {
  const [currentUri, setCurrentUri] = useState<string | null>(uri || fallbackUri || null);
  const [hasError, setHasError] = useState(false);

  const activeUri = hasError ? fallbackUri : currentUri || fallbackUri;

  if (!activeUri) {
    return <CatholicImagePlaceholder style={style} iconName={iconName} compact={compact} />;
  }

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <CatholicImagePlaceholder style={StyleSheet.absoluteFill} iconName={iconName} compact={compact} />
      <Image
        key={activeUri}
        source={{ uri: activeUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        onError={() => {
          if (!hasError && fallbackUri && fallbackUri !== activeUri) {
            setHasError(true);
            setCurrentUri(fallbackUri);
          } else {
            setHasError(true);
          }
        }}
      />
    </View>
  );
}

export default function ReadScreen() {
  const theme = useTheme();
  const [selectedArticle, setSelectedArticle] = useState<ArticleDTO | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const readQuery = useQuery({
    queryKey: ['app', 'read'],
    queryFn: () => appContentApi.read(),
  });

  const categories: ArticleCategoryDTO[] = readQuery.data?.data.categories ?? [];
  const rawArticles: ArticleDTO[] = readQuery.data?.data.articles ?? [];

  const queryLower = searchQuery.toLowerCase().trim();

  const articles = rawArticles.filter((article) => {
    const matchesCategory =
      selectedCategoryId === null || article.categories.some((c) => c.id === selectedCategoryId);
    const matchesSearch =
      !queryLower ||
      article.title.toLowerCase().includes(queryLower) ||
      (article.description && article.description.toLowerCase().includes(queryLower));
    return matchesCategory && matchesSearch;
  });

  const featuredArticle = articles.length > 0 ? articles[0] : null;
  const remainingArticles = articles.length > 1 ? articles.slice(1) : [];
  const selectedCategoryName =
    selectedCategoryId === null
      ? 'All Reflections'
      : categories.find((c) => c.id === selectedCategoryId)?.name || 'Category Filter';

  return (
    <>
      <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: theme.background }]}>
        <View style={styles.maxContainer}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={[styles.liturgicalTag, { backgroundColor: theme.goldSoft }]}>
                <Ionicons name="book" size={12} color={theme.gold} />
                <ThemedText type="badge" themeColor="gold">
                  DAILY SPIRITUAL FEED
                </ThemedText>
              </View>
            </View>

            <ThemedText type="heroTitle" style={styles.title}>
              Read & Reflections
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Fr. Morsin Livingston Homilies, Meditations & Catholic Teachings
            </ThemedText>

            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Ionicons name="search" size={16} color={theme.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search homilies, reflections..."
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searchQuery ? (
                <Pressable onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            {/* Non-horizontal Category Filter Grid + Dropdown (No overflow) */}
            {categories.length > 0 ? (
              <View style={styles.categoryContainer}>
                <View style={styles.categoryBarRow}>
                  <Pressable
                    onPress={() => setIsCategoryModalOpen(true)}
                    style={({ pressed }) => [
                      styles.categoryDropdownBtn,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="funnel-outline" size={14} color={theme.accent} />
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.dropdownLabel}>
                      {selectedCategoryName}
                    </ThemedText>
                    <Ionicons name="chevron-down" size={14} color={theme.textSecondary} />
                  </Pressable>

                  {selectedCategoryId !== null ? (
                    <Pressable
                      onPress={() => setSelectedCategoryId(null)}
                      style={({ pressed }) => [
                        styles.resetFilterBtn,
                        { backgroundColor: theme.goldSoft },
                        pressed && styles.pressed,
                      ]}>
                      <Ionicons name="close-circle" size={14} color={theme.gold} />
                      <ThemedText type="badge" themeColor="gold">
                        Reset
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>

                {/* Wrapped Flex Grid - zero horizontal scroll, fits all screens */}
                <View style={styles.categoryWrapGrid}>
                  <Pressable
                    onPress={() => setSelectedCategoryId(null)}
                    style={({ pressed }) => [
                      styles.categoryChip,
                      {
                        backgroundColor: selectedCategoryId === null ? theme.accent : theme.backgroundElement,
                        borderColor: selectedCategoryId === null ? theme.accent : theme.border,
                      },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText
                      type="smallBold"
                      style={{ color: selectedCategoryId === null ? '#ffffff' : theme.text }}>
                      All
                    </ThemedText>
                  </Pressable>

                  {categories.slice(0, 4).map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                        style={({ pressed }) => [
                          styles.categoryChip,
                          {
                            backgroundColor: isSelected ? theme.accent : theme.backgroundElement,
                            borderColor: isSelected ? theme.accent : theme.border,
                          },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText
                          type="smallBold"
                          numberOfLines={1}
                          style={{ color: isSelected ? '#ffffff' : theme.text }}>
                          {cat.name}
                        </ThemedText>
                      </Pressable>
                    );
                  })}

                  {categories.length > 4 ? (
                    <Pressable
                      onPress={() => setIsCategoryModalOpen(true)}
                      style={({ pressed }) => [
                        styles.categoryChipMore,
                        { backgroundColor: theme.goldSoft, borderColor: theme.border },
                        pressed && styles.pressed,
                      ]}>
                      <ThemedText type="badge" themeColor="gold">
                        +{categories.length - 4} More
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>

          {readQuery.isLoading ? <LoadingState message="Loading spiritual reflections..." /> : null}
          {readQuery.isError ? (
            <ErrorState
              message={
                readQuery.error instanceof Error ? readQuery.error.message : 'Could not load articles.'
              }
              onRetry={() => readQuery.refetch()}
            />
          ) : null}
          {readQuery.data && articles.length === 0 ? (
            <EmptyState message="No spiritual reflections matching your search." />
          ) : null}

          {articles.length > 0 ? (
            <FlatList
              data={remainingArticles}
              keyExtractor={(article) => String(article.id)}
              contentContainerStyle={{ paddingBottom: BottomTabInset + Spacing.six }}
              refreshControl={
                <RefreshControl refreshing={readQuery.isRefetching} onRefresh={() => readQuery.refetch()} />
              }
              ListHeaderComponent={
                featuredArticle ? (
                  <FeaturedArticleCard
                    article={featuredArticle}
                    onSelect={() => setSelectedArticle(featuredArticle)}
                  />
                ) : null
              }
              renderItem={({ item }) => (
                <ArticleRow article={item} onSelectArticle={() => setSelectedArticle(item)} />
              )}
            />
          ) : null}
        </View>
      </SafeAreaView>

      {/* Category Modal Dialog */}
      <Modal visible={isCategoryModalOpen} transparent animationType="fade" onRequestClose={() => setIsCategoryModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsCategoryModalOpen(false)} />
          <ThemedView variant="elevated" style={styles.categoryModalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="funnel" size={18} color={theme.accent} />
              <ThemedText type="subtitle" style={{ flex: 1 }}>
                Filter Reflection Category
              </ThemedText>
              <Pressable onPress={() => setIsCategoryModalOpen(false)}>
                <Ionicons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: Spacing.one }}>
              <Pressable
                onPress={() => {
                  setSelectedCategoryId(null);
                  setIsCategoryModalOpen(false);
                }}
                style={[
                  styles.modalCategoryOption,
                  selectedCategoryId === null && { backgroundColor: theme.accentLight },
                ]}>
                <Ionicons
                  name={selectedCategoryId === null ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selectedCategoryId === null ? theme.accent : theme.textSecondary}
                />
                <ThemedText
                  type="smallBold"
                  style={{ flex: 1, color: selectedCategoryId === null ? theme.accent : theme.text }}>
                  All Reflections
                </ThemedText>
              </Pressable>

              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      setSelectedCategoryId(cat.id);
                      setIsCategoryModalOpen(false);
                    }}
                    style={[
                      styles.modalCategoryOption,
                      isSelected && { backgroundColor: theme.accentLight },
                    ]}>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? theme.accent : theme.textSecondary}
                    />
                    <ThemedText
                      type="smallBold"
                      style={{ flex: 1, color: isSelected ? theme.accent : theme.text }}>
                      {cat.name}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      <ArticleDetailModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </>
  );
}

function FeaturedArticleCard({ article, onSelect }: { article: ArticleDTO; onSelect: () => void }) {
  const theme = useTheme();
  const categoryNames = article.categories.map((c) => c.name).join(' · ') || 'Daily Reflection';
  const imageUrl = getArticleImage(article);
  const fallback = CATHOLIC_ARTWORK_IMAGES[Math.abs(article.id || 0) % CATHOLIC_ARTWORK_IMAGES.length];

  return (
    <Pressable onPress={onSelect} style={({ pressed }) => [styles.featuredPressable, pressed && styles.pressed]}>
      <ThemedView variant="elevated" style={styles.featuredCard}>
        <View style={styles.heroImgWrap}>
          <SafeArticleImage uri={imageUrl} fallbackUri={fallback} style={styles.featuredHeroImage} iconName="book" />
          <View style={[styles.featuredCategoryPill, { backgroundColor: theme.accent }]}>
            <ThemedText type="badge" style={{ color: '#ffffff' }} numberOfLines={1}>
              {categoryNames.toUpperCase()}
            </ThemedText>
          </View>
        </View>

        <View style={styles.featuredBody}>
          <View style={styles.featuredTopRow}>
            <View style={styles.shepherdRow}>
              <Ionicons name="sparkles" size={14} color={theme.gold} />
              <ThemedText type="smallBold" themeColor="gold">
                Fr. Morsin Livingston Reflection
              </ThemedText>
            </View>

            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
              <ThemedText type="badge" themeColor="textSecondary">
                4 MIN READ
              </ThemedText>
            </View>
          </View>

          <ThemedText type="subtitle" style={styles.featuredTitle}>
            {article.title}
          </ThemedText>

          {article.description ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.featuredDesc}>
              {article.description}
            </ThemedText>
          ) : null}

          <View style={styles.featuredFooter}>
            <View style={styles.readNowRow}>
              <Ionicons name="book-outline" size={16} color={theme.accent} />
              <ThemedText type="smallBold" themeColor="accent">
                Read Full Spiritual Homily
              </ThemedText>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color={theme.accent} />
          </View>
        </View>
      </ThemedView>
    </Pressable>
  );
}

function ArticleRow({ article, onSelectArticle }: { article: ArticleDTO; onSelectArticle: () => void }) {
  const theme = useTheme();
  const categoryNames = article.categories.map((c) => c.name).join(' · ') || 'Reflection';
  const imageUrl = getArticleImage(article);
  const fallback = CATHOLIC_ARTWORK_IMAGES[Math.abs(article.id || 0) % CATHOLIC_ARTWORK_IMAGES.length];

  return (
    <Pressable onPress={onSelectArticle} style={({ pressed }) => [styles.rowPressable, pressed && styles.pressed]}>
      <ThemedView variant="elevated" style={styles.articleRow}>
        <View style={styles.thumbWrap}>
          <SafeArticleImage uri={imageUrl} fallbackUri={fallback} style={styles.thumb} iconName="document-text-outline" compact={true} />
        </View>

        <View style={styles.rowBody}>
          <View style={[styles.categoryPill, { backgroundColor: theme.accentLight }]}>
            <ThemedText type="badge" themeColor="accent" numberOfLines={1}>
              {categoryNames.toUpperCase()}
            </ThemedText>
          </View>

          <ThemedText type="subtitle" numberOfLines={2} style={styles.articleTitle}>
            {article.title}
          </ThemedText>

          <View style={styles.authorMetaRow}>
            <Ionicons name="person" size={12} color={theme.gold} />
            <ThemedText type="small" themeColor="gold">
              Fr. Morsin Livingston
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              · 3 min
            </ThemedText>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  maxContainer: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liturgicalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  title: {
    marginTop: Spacing.half,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: Spacing.one,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  categoryContainer: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  categoryBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  categoryDropdownBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.oneHalf,
    borderRadius: Radius.medium,
    borderWidth: 1,
    height: 38,
  },
  dropdownLabel: {
    flex: 1,
  },
  resetFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    height: 38,
    borderRadius: Radius.medium,
  },
  categoryWrapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipMore: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredPressable: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    marginTop: Spacing.two,
  },
  featuredCard: {
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  heroImgWrap: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  featuredHeroImage: {
    width: '100%',
    height: 200,
  },
  featuredCategoryPill: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  shepherdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  authorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 2,
  },
  featuredBody: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featuredTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  featuredDesc: {
    lineHeight: 20,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 20, 41, 0.08)',
  },
  readNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  rowPressable: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.three,
  },
  articleRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    gap: Spacing.half,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  articleTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  thumbWrap: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: Radius.medium,
    overflow: 'hidden',
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: Radius.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  categoryModalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  modalCategoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
  },
  pressed: {
    opacity: 0.85,
  },
});

