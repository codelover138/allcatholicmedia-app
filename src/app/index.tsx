import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ArticleDetailModal } from '@/components/article-detail-modal';
import { PodcastEpisodesModal } from '@/components/podcast-episodes-modal';
import { PrayerRequestModal } from '@/components/prayer-request-modal';
import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  appContentApi,
  resolveImageUrl,
  type ArticleDTO,
  type HomeSection,
  type LiveStreamDTO,
  type PodcastShowDTO,
} from '@/lib/app-content';
import { useAppStore } from '@/lib/app-store';

const SECTION_HREF: Record<string, string> = {
  channels: '/live',
  live_now: '/live',
  listen: '/listen',
  read: '/read',
  saints: '/more',
  donate: '/more',
  prayer_requests: '/more',
};

const SECTION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  channels: 'tv-outline',
  live_now: 'radio-outline',
  listen: 'headset-outline',
  read: 'book-outline',
  saints: 'sparkles-outline',
  donate: 'heart-outline',
  prayer_requests: 'hand-left-outline',
};

function getDailyRosaryMystery() {
  const day = new Date().getDay();
  switch (day) {
    case 1:
    case 6:
      return {
        title: 'Joyful Mysteries',
        tag: 'MONDAY & SATURDAY',
        episodes: ['Annunciation', 'Visitation', 'Nativity', 'Presentation', 'Finding in Temple'],
      };
    case 2:
    case 5:
      return {
        title: 'Sorrowful Mysteries',
        tag: 'TUESDAY & FRIDAY',
        episodes: ['Agony in Garden', 'Scourging', 'Crowning with Thorns', 'Carrying Cross', 'Crucifixion'],
      };
    case 4:
      return {
        title: 'Luminous Mysteries',
        tag: 'THURSDAY · MYSTERIES OF LIGHT',
        episodes: [
          'Baptism of Jesus',
          'Wedding at Cana',
          'Proclamation of Kingdom',
          'Transfiguration',
          'Institution of Eucharist',
        ],
      };
    case 0:
    case 3:
    default:
      return {
        title: 'Glorious Mysteries',
        tag: 'SUNDAY & WEDNESDAY',
        episodes: ['Resurrection', 'Ascension', 'Descent of Holy Spirit', 'Assumption', 'Coronation of Mary'],
      };
  }
}

export default function HomeScreen() {
  const theme = useTheme();
  const openVideoModal = useAppStore((state) => state.openVideoModal);
  const playTrack = useAppStore((state) => state.playTrack);
  const dailyPrayerCount = useAppStore((state) => state.dailyPrayerCount);
  const userPrayedToday = useAppStore((state) => state.userPrayedToday);
  const recordTodayPrayer = useAppStore((state) => state.recordTodayPrayer);

  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [prayerModalOpen, setPrayerModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<ArticleDTO | null>(null);
  const [selectedShow, setSelectedShow] = useState<PodcastShowDTO | null>(null);
  const [prayerToast, setPrayerToast] = useState(false);
  const [activeDecadeIdx, setActiveDecadeIdx] = useState<number>(0);

  const rosaryMystery = getDailyRosaryMystery();

  const homeQuery = useQuery({
    queryKey: ['app', 'home'],
    queryFn: appContentApi.home,
  });

  const liveNowQuery = useQuery({
    queryKey: ['app', 'live-now'],
    queryFn: appContentApi.liveNow,
  });

  const listenQuery = useQuery({
    queryKey: ['app', 'listen'],
    queryFn: () => appContentApi.listen(),
  });

  const readQuery = useQuery({
    queryKey: ['app', 'read'],
    queryFn: () => appContentApi.read(),
  });

  const saintsQuery = useQuery({
    queryKey: ['app', 'saints'],
    queryFn: () => appContentApi.saints({ page: 1 }),
  });

  const liveStream = liveNowQuery.data?.data.live_now[0];
  const upcomingStreams = liveNowQuery.data?.data.upcoming ?? [];
  const podcastShows = listenQuery.data?.data.shows ?? [];
  const latestArticles = readQuery.data?.data.articles ?? [];
  const featuredSaints = saintsQuery.data?.data.saints ?? [];
  const featuredSaint = featuredSaints[0];

  const todayFormatted = new Date()
    .toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase();

  const handlePlayRosary = () => {
    playTrack({
      id: 'daily-rosary',
      title: `The Holy Rosary — ${rosaryMystery.title}`,
      showName: 'Daily Catholic Devotion',
      audioUrl: 'https://allcatholicmedia.com/api/app/listen',
      duration: '22:00',
    });
  };

  const handlePlayHomily = () => {
    playTrack({
      id: 'daily-homily',
      title: 'Daily Mass Homily & Gospel Reflection',
      showName: 'Fr. Morsin Livingston Ministry',
      audioUrl: 'https://allcatholicmedia.com/api/app/read',
      duration: '08:45',
    });
  };

  const handleRecordPrayer = () => {
    recordTodayPrayer();
    setPrayerToast(true);
    setTimeout(() => setPrayerToast(false), 4000);
  };

  const filteredShows = searchQuery
    ? podcastShows.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : podcastShows;

  const filteredArticles = searchQuery
    ? latestArticles.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : latestArticles;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: theme.background }}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={
              homeQuery.isRefetching ||
              liveNowQuery.isRefetching ||
              listenQuery.isRefetching ||
              readQuery.isRefetching ||
              saintsQuery.isRefetching
            }
            onRefresh={() => {
              homeQuery.refetch();
              liveNowQuery.refetch();
              listenQuery.refetch();
              readQuery.refetch();
              saintsQuery.refetch();
            }}
          />
        }>
        <SafeAreaView edges={['top']} style={styles.safeContainer}>
          <View style={styles.maxContainer}>
            {/* Pristine Brand Header */}
            <View style={styles.header}>
              <View style={styles.headerTopRow}>
                <View style={styles.brandGroup}>
                  <View style={styles.brandEmblem}>
                    <Ionicons name="sparkles" size={16} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="subtitle" numberOfLines={1} style={styles.brandTitleText}>
                      Fr. Morsin Livingston
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      All Catholic Media Official App
                    </ThemedText>
                  </View>
                </View>

                <View style={styles.headerActions}>
                  <Pressable
                    onPress={() => setSearchVisible((prev) => !prev)}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons
                      name={searchVisible ? 'close' : 'search'}
                      size={18}
                      color={theme.text}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => setPrayerModalOpen(true)}
                    style={({ pressed }) => [
                      styles.iconBtn,
                      { backgroundColor: theme.accentLight, borderColor: theme.accentSoft },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="hand-left" size={18} color={theme.accent} />
                  </Pressable>
                </View>
              </View>

              {/* Liturgical Date & Season Pill */}
              <View style={[styles.liturgicalBar, { backgroundColor: theme.goldSoft, borderColor: theme.border }]}>
                <Ionicons name="sparkles" size={12} color={theme.gold} />
                <ThemedText type="badge" themeColor="gold">
                  {todayFormatted} · ORDINARY TIME LITURGY
                </ThemedText>
              </View>

              {/* Search Bar Input */}
              {searchVisible ? (
                <View
                  style={[
                    styles.searchBarWrap,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}>
                  <Ionicons name="search" size={16} color={theme.textSecondary} />
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search broadcasts, podcasts & homilies..."
                    placeholderTextColor={theme.textMuted}
                    style={[styles.searchInput, { color: theme.text }]}
                    autoFocus
                  />
                  {searchQuery ? (
                    <Pressable onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>

            {/* Shepherd Welcome Card */}
            <View style={styles.shepherdBannerWrap}>
              <ThemedView variant="elevated" style={styles.shepherdCard}>
                <View style={styles.shepherdHeaderRow}>
                  <View style={[styles.shepherdAvatarBadge, { backgroundColor: theme.goldSoft }]}>
                    <Ionicons name="person-circle" size={32} color={theme.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="badge" themeColor="gold">
                      FOUNDER & SHEPHERD
                    </ThemedText>
                    <ThemedText type="subtitle" style={styles.shepherdName}>
                      Fr. Morsin Livingston
                    </ThemedText>
                  </View>
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.shepherdQuote}>
                  "Welcome to All Catholic Media. May our daily Mass broadcasts, holy reflections, and audio prayers draw your heart closer to Christ."
                </ThemedText>
                <View style={styles.shepherdActionsRow}>
                  <Pressable
                    onPress={handlePlayHomily}
                    style={({ pressed }) => [
                      styles.shepherdActionBtn,
                      { backgroundColor: theme.accentLight, borderColor: theme.accentSoft },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="play-circle" size={15} color={theme.accent} />
                    <ThemedText type="badge" style={{ color: theme.accent }}>
                      Listen Homily
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => setPrayerModalOpen(true)}
                    style={({ pressed }) => [
                      styles.shepherdActionBtn,
                      { backgroundColor: theme.goldSoft, borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="hand-left" size={15} color={theme.gold} />
                    <ThemedText type="badge" style={{ color: theme.gold }}>
                      Send Intention
                    </ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
            </View>

            {/* Clean 5-Item Quick Action Navigation Bar */}
            <View style={styles.quickGrid}>
              <Link href="/live" asChild>
                <Pressable style={styles.quickGridItem}>
                  <View style={[styles.quickIconCircle, { backgroundColor: theme.accentLight }]}>
                    <Ionicons name="radio" size={18} color={theme.accent} />
                  </View>
                  <ThemedText type="badge" numberOfLines={1} style={{ color: theme.accent }}>
                    Live TV
                  </ThemedText>
                </Pressable>
              </Link>

              <Link href="/listen" asChild>
                <Pressable style={styles.quickGridItem}>
                  <View style={[styles.quickIconCircle, { backgroundColor: theme.goldSoft }]}>
                    <Ionicons name="headset" size={18} color={theme.gold} />
                  </View>
                  <ThemedText type="badge" numberOfLines={1} style={{ color: theme.gold }}>
                    Podcasts
                  </ThemedText>
                </Pressable>
              </Link>

              <Link href="/read" asChild>
                <Pressable style={styles.quickGridItem}>
                  <View style={[styles.quickIconCircle, { backgroundColor: theme.backgroundElement, borderColor: theme.border, borderWidth: 1 }]}>
                    <Ionicons name="book" size={18} color={theme.text} />
                  </View>
                  <ThemedText type="badge" numberOfLines={1} themeColor="text">
                    Homilies
                  </ThemedText>
                </Pressable>
              </Link>

              <Pressable onPress={() => setPrayerModalOpen(true)} style={styles.quickGridItem}>
                <View style={[styles.quickIconCircle, { backgroundColor: theme.accentLight }]}>
                  <Ionicons name="hand-left" size={18} color={theme.accent} />
                </View>
                <ThemedText type="badge" numberOfLines={1} style={{ color: theme.accent }}>
                  Intentions
                </ThemedText>
              </Pressable>

              <Link href="/more" asChild>
                <Pressable style={styles.quickGridItem}>
                  <View style={[styles.quickIconCircle, { backgroundColor: theme.goldSoft }]}>
                    <Ionicons name="sparkles" size={18} color={theme.gold} />
                  </View>
                  <ThemedText type="badge" numberOfLines={1} style={{ color: theme.gold }}>
                    Saints
                  </ThemedText>
                </Pressable>
              </Link>
            </View>

            {/* Featured Hero Broadcast Banner */}
            <Pressable
              onPress={() =>
                openVideoModal(
                  liveStream?.embed_url || 'https://www.youtube.com/embed/live_stream',
                  liveStream?.title || 'All Catholic Media — Live Stream & Mass'
                )
              }
              style={({ pressed }) => pressed && styles.pressed}>
              <View style={styles.heroBanner}>
                <View style={styles.heroBadgeRow}>
                  <View style={styles.livePulseDot} />
                  <ThemedText type="badge" style={styles.heroTagText}>
                    {liveStream ? 'FR. MORSIN LIVE BROADCAST' : "FR. MORSIN'S DAILY HOMILY"}
                  </ThemedText>
                  {liveStream?.source_name ? (
                    <View style={styles.sourceTagPill}>
                      <ThemedText type="badge" numberOfLines={1} style={styles.sourceTagText}>
                        {liveStream.source_name}
                      </ThemedText>
                    </View>
                  ) : null}
                </View>

                <ThemedText type="subtitle" numberOfLines={2} style={styles.heroTitle}>
                  {liveStream?.title || 'Fr. Morsin Livingston Daily Mass & Homily Reflection'}
                </ThemedText>

                <View style={styles.heroWatchBtn}>
                  <Ionicons name="play-circle" size={20} color="#ffffff" />
                  <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                    {liveStream ? 'Watch Fr. Morsin Live' : "Play Fr. Morsin's Homily"}
                  </ThemedText>
                </View>
              </View>
            </Pressable>

            {/* Upcoming Streams Carousel */}
            {upcomingStreams.length > 0 ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText type="sectionHeader" themeColor="gold">
                    UPCOMING LIVE BROADCASTS
                  </ThemedText>
                  <Link href="/live" asChild>
                    <Pressable>
                      <ThemedText type="smallBold" themeColor="accent">
                        Schedule →
                      </ThemedText>
                    </Pressable>
                  </Link>
                </View>

                <FlatList
                  data={upcomingStreams}
                  keyExtractor={(item) => String(item.id)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carouselList}
                  renderItem={({ item }) => (
                    <UpcomingStreamCard item={item} onOpen={openVideoModal} />
                  )}
                />
              </View>
            ) : null}

            {/* Holy Rosary Card with Bead Selector */}
            <ThemedView variant="elevated" style={styles.cardBox}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.rosaryIconWrap, { backgroundColor: theme.goldSoft }]}>
                  <Ionicons name="rose" size={24} color={theme.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="badge" themeColor="gold">
                    {rosaryMystery.tag}
                  </ThemedText>
                  <ThemedText type="subtitle" style={styles.rosaryTitle}>
                    {rosaryMystery.title}
                  </ThemedText>
                </View>
              </View>

              {/* Numbered Rosary Decade Bead Circles */}
              <View style={styles.beadsContainer}>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 4 }}>
                  Select Mystery Decade:
                </ThemedText>
                <View style={styles.beadsRow}>
                  {rosaryMystery.episodes.map((ep, idx) => {
                    const isActive = activeDecadeIdx === idx;
                    return (
                      <Pressable
                        key={idx}
                        onPress={() => setActiveDecadeIdx(idx)}
                        style={[
                          styles.beadCircle,
                          {
                            backgroundColor: isActive ? theme.gold : theme.borderLight,
                          },
                        ]}>
                        <ThemedText
                          type="smallBold"
                          style={{ color: isActive ? '#ffffff' : theme.textSecondary }}>
                          {idx + 1}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>

                <ThemedText type="smallBold" themeColor="text" style={styles.decadeNameText}>
                  Decade {activeDecadeIdx + 1}: {rosaryMystery.episodes[activeDecadeIdx]}
                </ThemedText>
              </View>

              <Pressable
                onPress={handlePlayRosary}
                style={({ pressed }) => [
                  styles.primaryAudioBtn,
                  { backgroundColor: theme.gold },
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="headset" size={16} color="#ffffff" />
                <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                  Pray Holy Rosary Audio (22 min)
                </ThemedText>
              </Pressable>
            </ThemedView>

            {/* Daily Scripture Card */}
            <ThemedView variant="elevated" style={styles.verseCard}>
              <View style={styles.verseHeaderRow}>
                <Ionicons name="bookmark" size={16} color={theme.gold} />
                <ThemedText type="sectionHeader" themeColor="gold">
                  DAILY GOSPEL & HOMILY REFLECTION
                </ThemedText>
              </View>
              <ThemedText type="default" style={styles.verseText}>
                "I can do all things through Christ who strengthens me."
              </ThemedText>
              <View style={styles.verseFooterRow}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  — Philippians 4:13
                </ThemedText>
                <Pressable
                  onPress={handlePlayHomily}
                  style={({ pressed }) => [
                    styles.listenHomilyPill,
                    { backgroundColor: theme.goldSoft, borderColor: theme.gold },
                    pressed && styles.pressed,
                  ]}>
                  <Ionicons name="play-circle" size={14} color={theme.gold} />
                  <ThemedText type="badge" style={{ color: theme.gold }}>
                    Listen Homily
                  </ThemedText>
                </Pressable>
              </View>
            </ThemedView>

            {/* Community Prayer Counter Card */}
            <ThemedView variant="elevated" style={styles.cardBox}>
              <View style={styles.prayerHeaderRow}>
                <View style={[styles.prayerIconWrap, { backgroundColor: theme.accentLight }]}>
                  <Ionicons name="heart" size={22} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="subtitle" style={styles.prayerCardTitle}>
                    Global Catholic Prayer Family
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {dailyPrayerCount.toLocaleString()} Catholics prayed together today
                  </ThemedText>
                </View>
              </View>

              {prayerToast ? (
                <View style={[styles.prayerToastBanner, { backgroundColor: theme.accentLight }]}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.accent} />
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    Amen! Your prayer has been recorded. May God bless you.
                  </ThemedText>
                </View>
              ) : null}

              <Pressable
                onPress={handleRecordPrayer}
                disabled={userPrayedToday}
                style={({ pressed }) => [
                  styles.prayerActionBtn,
                  {
                    backgroundColor: userPrayedToday ? theme.goldSoft : theme.accent,
                    borderColor: userPrayedToday ? theme.gold : theme.accent,
                  },
                  pressed && styles.pressed,
                ]}>
                <Ionicons
                  name={userPrayedToday ? 'checkmark-circle' : 'hand-left-outline'}
                  size={18}
                  color={userPrayedToday ? theme.gold : '#ffffff'}
                />
                <ThemedText
                  type="smallBold"
                  style={{ color: userPrayedToday ? theme.gold : '#ffffff' }}>
                  {userPrayedToday ? 'Prayer Recorded Today' : 'Amen, I Prayed Today'}
                </ThemedText>
              </Pressable>
            </ThemedView>

            {/* Saint of the Day Spotlight Card */}
            {featuredSaint ? (
              <ThemedView variant="elevated" style={styles.cardBox}>
                <View style={styles.verseHeaderRow}>
                  <Ionicons name="sparkles" size={16} color={theme.gold} />
                  <ThemedText type="sectionHeader" themeColor="gold">
                    SAINT OF THE DAY SPOTLIGHT
                  </ThemedText>
                </View>

                <View style={styles.saintBodyRow}>
                  {featuredSaint.image ? (
                    <Image source={{ uri: featuredSaint.image }} style={styles.saintAvatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.saintAvatarPlaceholder, { backgroundColor: theme.goldSoft }]}>
                      <Ionicons name="sparkles-outline" size={24} color={theme.gold} />
                    </View>
                  )}

                  <View style={{ flex: 1, gap: 4 }}>
                    <ThemedText type="subtitle" numberOfLines={1}>
                      {featuredSaint.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      {featuredSaint.description || 'Patron saint of faithful devotion & spiritual life.'}
                    </ThemedText>

                    <Link href="/more" asChild>
                      <Pressable style={{ marginTop: 2 }}>
                        <ThemedText type="smallBold" themeColor="accent">
                          Read Saint Bio & Prayer →
                        </ThemedText>
                      </Pressable>
                    </Link>
                  </View>
                </View>
              </ThemedView>
            ) : null}

            {/* Popular Podcasts Stack */}
            {filteredShows.length > 0 ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.one }}>
                    <Ionicons name="headset" size={16} color={theme.gold} />
                    <ThemedText type="sectionHeader" themeColor="gold">
                      POPULAR AUDIO PODCASTS
                    </ThemedText>
                  </View>
                  <Link href="/listen" asChild>
                    <Pressable>
                      <ThemedText type="smallBold" themeColor="accent">
                        See All →
                      </ThemedText>
                    </Pressable>
                  </Link>
                </View>

                <View style={styles.podcastsStack}>
                  {filteredShows.slice(0, 3).map((item, index) => {
                    const FALLBACKS = [
                      'https://images.unsplash.com/photo-1519817650390-64a93db51146?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1548625361-180800b55a30?auto=format&fit=crop&w=600&q=80',
                      'https://images.unsplash.com/photo-1509021436468-d02aa3d51100?auto=format&fit=crop&w=600&q=80',
                    ];
                    const thumbUrl = resolveImageUrl(item.thumbnail) || FALLBACKS[index % FALLBACKS.length];

                    return (
                      <Pressable
                        key={item.slug || String(index)}
                        onPress={() => setSelectedShow(item)}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedView variant="elevated" style={styles.podcastRowCard}>
                          <Image source={{ uri: thumbUrl }} style={styles.podcastRowThumb} contentFit="cover" />

                          <View style={styles.podcastRowBody}>
                            {item.category ? (
                              <View style={[styles.podcastCatPill, { backgroundColor: theme.goldSoft }]}>
                                <ThemedText type="badge" themeColor="gold" numberOfLines={1}>
                                  {item.category.toUpperCase()}
                                </ThemedText>
                              </View>
                            ) : null}

                            <ThemedText type="subtitle" numberOfLines={1} style={styles.podcastRowTitle}>
                              {item.name}
                            </ThemedText>

                            <View style={styles.podcastRowMeta}>
                              <Ionicons name="mic-outline" size={12} color={theme.textSecondary} />
                              <ThemedText type="small" themeColor="textSecondary">
                                {item.episodes_count} episodes · Fr. Morsin Livingston
                              </ThemedText>
                            </View>
                          </View>

                          <View style={[styles.podcastPlayBtnCircle, { backgroundColor: theme.accentLight }]}>
                            <Ionicons name="play" size={14} color={theme.accent} />
                          </View>
                        </ThemedView>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Latest Articles */}
            {filteredArticles.length > 0 ? (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeaderRow}>
                  <ThemedText type="sectionHeader" themeColor="gold">
                    LATEST REFLECTIONS & HOMILIES
                  </ThemedText>
                  <Link href="/read" asChild>
                    <Pressable>
                      <ThemedText type="smallBold" themeColor="accent">
                        Read All
                      </ThemedText>
                    </Pressable>
                  </Link>
                </View>

                <View style={styles.articlesStack}>
                  {filteredArticles.slice(0, 4).map((article) => {
                    const articleImg = resolveImageUrl(article.image) || 'https://images.unsplash.com/photo-1548625361-180800b55a30?auto=format&fit=crop&w=600&q=80';
                    return (
                      <Pressable
                        key={article.id}
                        onPress={() => setSelectedArticle(article)}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedView variant="elevated" style={styles.articleCard}>
                          <Image source={{ uri: articleImg }} style={styles.articleThumb} contentFit="cover" />

                          <View style={styles.articleBody}>
                            <ThemedText type="badge" themeColor="accent">
                              {article.categories.map((c) => c.name).join(' · ') || 'Reflection'}
                            </ThemedText>
                            <ThemedText type="subtitle" numberOfLines={2} style={styles.articleTitleText}>
                              {article.title}
                            </ThemedText>
                          </View>

                          <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
                        </ThemedView>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {/* Query Loading & Error States */}
            {homeQuery.isLoading ? <LoadingState message="Loading Catholic dashboard..." /> : null}
            {homeQuery.isError ? (
              <ErrorState
                message={
                  homeQuery.error instanceof Error ? homeQuery.error.message : 'Could not load feed.'
                }
                onRetry={() => homeQuery.refetch()}
              />
            ) : null}

          </View>
        </SafeAreaView>
      </ScrollView>

      <PrayerRequestModal visible={prayerModalOpen} onClose={() => setPrayerModalOpen(false)} />
      <ArticleDetailModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      <PodcastEpisodesModal show={selectedShow} onClose={() => setSelectedShow(null)} />
    </>
  );
}

function UpcomingStreamCard({
  item,
  onOpen,
}: {
  item: LiveStreamDTO;
  onOpen: (url: string, title: string) => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onOpen(item.embed_url || 'https://www.youtube.com/embed/live_stream', item.title)}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView variant="elevated" style={styles.upcomingCard}>
        <View style={styles.upcomingHeaderRow}>
          <View style={[styles.upcomingBadge, { backgroundColor: theme.goldSoft }]}>
            <Ionicons name="time-outline" size={12} color={theme.gold} />
            <ThemedText type="badge" themeColor="gold">
              UPCOMING
            </ThemedText>
          </View>
          {item.location ? (
            <ThemedText type="badge" themeColor="textSecondary">
              {item.location}
            </ThemedText>
          ) : null}
        </View>
        <ThemedText type="subtitle" numberOfLines={2} style={styles.upcomingTitle}>
          {item.title}
        </ThemedText>
        <View style={styles.upcomingFooter}>
          <Ionicons name="play-circle-outline" size={16} color={theme.accent} />
          <ThemedText type="smallBold" themeColor="accent">
            Set Reminder / Watch
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

function SectionCard({ section, onOpenPrayer }: { section: HomeSection; onOpenPrayer: () => void }) {
  const theme = useTheme();
  const href = SECTION_HREF[section.key] ?? '/more';
  const iconName = SECTION_ICONS[section.key] ?? 'apps-outline';

  const cardContent = (
    <ThemedView variant="elevated" style={styles.gridCard}>
      <View style={styles.cardHeaderRow}>
        <View style={[styles.cardIconBadge, { backgroundColor: theme.accentLight }]}>
          <Ionicons name={iconName} size={20} color={theme.accent} />
        </View>
        {typeof section.count === 'number' ? (
          <View style={[styles.countBadge, { backgroundColor: theme.goldSoft }]}>
            <ThemedText type="badge" themeColor="gold">
              {section.count} items
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.cardBody}>
        <ThemedText type="subtitle" style={styles.cardTitle}>
          {section.title}
        </ThemedText>
      </View>

      <View style={styles.cardFooter}>
        <ThemedText type="smallBold" themeColor="accent">
          Explore Section
        </ThemedText>
        <Ionicons name="chevron-forward" size={16} color={theme.accent} />
      </View>
    </ThemedView>
  );

  if (section.key === 'prayer_requests') {
    return (
      <Pressable onPress={onOpenPrayer} style={({ pressed }) => [styles.gridPressable, pressed && styles.pressed]}>
        {cardContent}
      </Pressable>
    );
  }

  return (
    <Link href={href as never} asChild>
      <Pressable style={({ pressed }) => [styles.gridPressable, pressed && styles.pressed]}>
        {cardContent}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  safeContainer: {
    paddingBottom: BottomTabInset + Spacing.six,
  },
  maxContainer: {
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
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  brandEmblem: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#801429',
  },
  brandTitleText: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
  },
  liturgicalBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.oneHalf,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: Spacing.one,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  shepherdBannerWrap: {
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  shepherdCard: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  shepherdHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  shepherdAvatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shepherdName: {
    fontSize: 16,
    lineHeight: 20,
  },
  shepherdQuote: {
    fontStyle: 'italic',
    lineHeight: 18,
  },
  shepherdActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  shepherdActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  quickGridItem: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBanner: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.one,
    marginBottom: Spacing.four,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.three,
    backgroundColor: '#7A1227',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.oneHalf,
    flexWrap: 'wrap',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4d5a',
  },
  heroTagText: {
    color: '#ffffff',
    letterSpacing: 1,
  },
  sourceTagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.full,
    maxWidth: 160,
  },
  sourceTagText: {
    color: '#ffffff',
    fontSize: 10,
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 24,
  },
  heroWatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
    marginTop: Spacing.one,
  },
  sectionWrap: {
    marginBottom: Spacing.four,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  carouselList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  upcomingCard: {
    width: 220,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  upcomingTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  upcomingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: 'auto',
  },
  cardBox: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rosaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosaryTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  beadsContainer: {
    gap: Spacing.one,
  },
  beadsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  beadCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decadeNameText: {
    marginTop: 4,
    fontSize: 13,
  },
  primaryAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
  },
  verseCard: {
    marginHorizontal: Spacing.four,
    marginBottom: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
    borderLeftWidth: 4,
    borderLeftColor: '#b8860b',
  },
  verseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.oneHalf,
  },
  verseText: {
    fontStyle: 'italic',
    fontSize: 16,
    lineHeight: 24,
  },
  verseFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  verseRef: {
    alignSelf: 'center',
  },
  listenHomilyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  prayerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  prayerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prayerCardTitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  prayerToastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.medium,
  },
  prayerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  saintBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  saintAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  saintAvatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastsStack: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  podcastRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
    borderRadius: Radius.large,
  },
  podcastRowThumb: {
    width: 64,
    height: 64,
    borderRadius: Radius.medium,
  },
  podcastRowBody: {
    flex: 1,
    gap: 4,
  },
  podcastCatPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.oneHalf,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  podcastRowTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  podcastRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  podcastPlayBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  podcastEpisodeMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  articlesStack: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  articleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  articleThumb: {
    width: 68,
    height: 68,
    borderRadius: Radius.medium,
  },
  articleThumbPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleBody: {
    flex: 1,
    gap: 4,
  },
  articleTitleText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sectionsGrid: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  gridPressable: {
    width: '100%',
  },
  gridCard: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardBody: {
    gap: Spacing.half,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128, 20, 41, 0.08)',
  },
  countBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  cardIconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
