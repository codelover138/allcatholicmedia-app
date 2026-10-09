import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { ErrorState, LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { openArticle } from '@/components/article-detail';
import { ScreenBackground } from '@/components/screen-background';
import { useVideoPlayer } from '@/components/video-player';
import { appContentApi, mediaUrl, type VideoDTO } from '@/lib/app-content';
import { formatDuration, formatShortDate } from '@/lib/format';

type HeroVideo = {
  title: string;
  channel: string;
  duration: string | null;
  thumbnail: string | null;
  published_at: string | null;
  video_url: string | null;
};

// Fallback for the Daily Rosary card when the home spotlights endpoint is
// unavailable: the traditional weekday assignment of the Rosary mysteries.
const ROSARY_MYSTERIES = [
  'The Glorious Mysteries', // Sun
  'The Joyful Mysteries', // Mon
  'The Sorrowful Mysteries', // Tue
  'The Glorious Mysteries', // Wed
  'The Luminous Mysteries', // Thu
  'The Sorrowful Mysteries', // Fri
  'The Joyful Mysteries', // Sat
];

// The ministry's guiding verse — the Great Commission — shown in the founder card.
const FOUNDER_VERSE = {
  text: 'Go into all the world and proclaim the Gospel to the whole creation.',
  source: 'Mark 16:15',
};

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { play } = useVideoPlayer();

  const liveQuery = useQuery({ queryKey: ['app', 'live-now'], queryFn: appContentApi.liveNow });
  const channelsQuery = useQuery({ queryKey: ['app', 'channels'], queryFn: appContentApi.channels });
  const saintsQuery = useQuery({ queryKey: ['app', 'saints'], queryFn: () => appContentApi.saints() });
  const readQuery = useQuery({ queryKey: ['app', 'read'], queryFn: () => appContentApi.read() });
  const listenQuery = useQuery({ queryKey: ['app', 'listen'], queryFn: () => appContentApi.listen() });
  // Rosary / Saint / Vatican News, resolved server-side exactly like the website
  // home page's theme shortcodes. Category 12 = "Daily Rosary".
  const spotlightsQuery = useQuery({
    queryKey: ['app', 'home-spotlights'],
    queryFn: appContentApi.homeSpotlights,
  });
  // Daily Rosary = latest upload from the "Daily Rosary Meditations" YouTube
  // channel — the same source the website home page pulls from. Fetched straight
  // from YouTube's public feed; the CMS category feed is a fallback.
  const rosaryVideoQuery = useQuery({
    queryKey: ['app', 'daily-rosary-video'],
    queryFn: appContentApi.latestRosaryVideo,
    enabled: !spotlightsQuery.data?.data?.rosary,
    staleTime: 1000 * 60 * 30,
  });
  const rosaryQuery = useQuery({
    queryKey: ['app', 'read', 'daily-rosary'],
    queryFn: () => appContentApi.read({ category: 12 }),
    enabled: !spotlightsQuery.data?.data?.rosary && !rosaryVideoQuery.data,
  });

  const queries = [liveQuery, channelsQuery, saintsQuery, readQuery, listenQuery, spotlightsQuery];
  const refetchAll = () =>
    [...queries, rosaryVideoQuery, rosaryQuery].forEach((q) => q.refetch());

  const spotlights = spotlightsQuery.data?.data;

  const live = liveQuery.data?.data.live_now?.[0];
  const article = readQuery.data?.data.articles?.[0];
  const show = listenQuery.data?.data.shows?.[0];

  // The CMS category imports a batch of episodes with one identical timestamp;
  // break ties on id so the fallback matches the website's pick.
  const fallbackRosary = useMemo(() => {
    const articles = rosaryQuery.data?.data.articles ?? [];
    return [...articles].sort(
      (a, b) =>
        (b.published_at ?? '').localeCompare(a.published_at ?? '') || b.id - a.id,
    )[0];
  }, [rosaryQuery.data]);

  // Same source via the deployed /channels endpoint (works on web, no CORS) —
  // present once the "daily-rosary-meditations" channel is synced on the backend.
  const rosaryChannelVideo = useMemo(() => {
    const channel = (channelsQuery.data?.data ?? []).find(
      (c) => c.slug === 'daily-rosary-meditations',
    );
    const v = channel?.latest_video;
    return v
      ? {
          title: v.title,
          video_url: v.video_url,
          embed_url: v.embed_url,
          thumbnail: v.thumbnail,
          published_at: v.published_at,
          channel: channel.name,
        }
      : null;
  }, [channelsQuery.data]);

  const rosaryVideo =
    spotlights?.rosary ?? rosaryVideoQuery.data ?? rosaryChannelVideo ?? null;
  const rosaryVideoUrl = rosaryVideo?.video_url ?? fallbackRosary?.url;
  const rosaryTitle = rosaryVideo?.title ?? fallbackRosary?.title;
  const rosaryLabel =
    rosaryTitle?.replace(/^\[Daily Rosary Meditations\]\s*/i, '') ??
    ROSARY_MYSTERIES[new Date().getDay()];

  // Prefer the server-resolved saint (today's feast when there is one); fall
  // back to the newest-dated entry from the alphabetical /saints list.
  const saint = useMemo(() => {
    if (spotlights?.saint) return spotlights.saint;
    const saints = saintsQuery.data?.data.saints ?? [];
    return [...saints].sort((a, b) =>
      (b.published_at ?? '').localeCompare(a.published_at ?? ''),
    )[0];
  }, [spotlights?.saint, saintsQuery.data]);

  const rosaryImage = rosaryVideo?.thumbnail ?? null;
  const saintImage = mediaUrl(saint?.image);

  // The founder's own YouTube channel avatar, reused as his portrait here.
  const founderAvatar = useMemo(
    () =>
      (channelsQuery.data?.data ?? []).find((c) => /morson/i.test(c.name))?.thumbnail ?? null,
    [channelsQuery.data],
  );

  const channelVideos = useMemo<(VideoDTO & { channel: string })[]>(
    () =>
      (channelsQuery.data?.data ?? [])
        .flatMap((c) => (c.latest_video ? [{ ...c.latest_video, channel: c.name }] : []))
        .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? '')),
    [channelsQuery.data],
  );

  // The website's video spotlight = latest upload from the "vatican-news"
  // YouTube channel ([channel-spotlight channel="vatican-news"]).
  const vaticanVideo = useMemo<HeroVideo | undefined>(() => {
    const v = spotlights?.vatican_news;
    if (v) {
      return {
        title: v.title,
        channel: v.channel.name,
        duration: v.duration,
        thumbnail: v.thumbnail,
        published_at: v.published_at,
        video_url: v.video_url,
      };
    }
    const channel = (channelsQuery.data?.data ?? []).find((c) => c.slug === 'vatican-news');
    return channel?.latest_video
      ? { ...channel.latest_video, channel: channel.name }
      : undefined;
  }, [spotlights?.vatican_news, channelsQuery.data]);

  const heroVideo: HeroVideo | undefined = vaticanVideo ?? channelVideos[0];
  const watchVideo =
    channelVideos.find((v) => v.title !== heroVideo?.title) ?? channelVideos[0];

  const initialLoading = queries.every((q) => q.isLoading);
  const allFailed = queries.every((q) => q.isError);

  return (
    <ScreenBackground>
    <ScrollView
      style={styles.transparent}
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={queries.some((q) => q.isRefetching)}
          onRefresh={refetchAll}
          tintColor={theme.textSecondary}
        />
      }>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <AppHeader />

        {initialLoading ? (
          <LoadingState />
        ) : allFailed ? (
          <ErrorState message="Could not reach All Catholic Media." onRetry={refetchAll} />
        ) : (
          <View style={styles.content}>
            {live ? <LiveBanner title={live.title} /> : null}

            <View>
              <ThemedText style={styles.greeting}>Peace be with you</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.intro}>
                One faith. One family. One place.
              </ThemedText>
            </View>

            <FounderCard avatar={founderAvatar} quote={FOUNDER_VERSE} />

            <ContinueCard
              video={heroVideo}
              label={vaticanVideo ? 'FROM VATICAN NEWS' : 'CONTINUE WATCHING'}
              onPress={() => play(heroVideo?.video_url, heroVideo?.title)}
            />

            <View style={styles.dualCards}>
              <PreviewCard
                label="DAILY ROSARY"
                title={rosaryLabel}
                image={rosaryImage}
                fallbackSymbol="✝"
                isVideo={!!rosaryVideoUrl}
                onPress={() => play(rosaryVideoUrl, rosaryLabel)}
              />
              <PreviewCard
                label="SAINT OF THE DAY"
                title={saint?.title ?? 'A saint to discover'}
                image={saintImage}
                fallbackSymbol="✦"
                onPress={() => openArticle('saints', saint?.url, saint?.title)}
              />
            </View>

            <View>
              <ThemedText style={styles.latestHeading}>Latest</ThemedText>
              <View style={styles.latestList}>
                <LatestRow
                  glyph="▶"
                  glyphColor="gold"
                  label="Watch"
                  title={watchVideo?.title ?? 'Sunday Mass and daily reflections'}
                  meta={joinMeta(
                    watchVideo?.channel ?? 'All Catholic Media',
                    formatShortDate(watchVideo?.published_at),
                  )}
                  image={watchVideo?.thumbnail}
                  isVideo
                  onPress={() => play(watchVideo?.video_url, watchVideo?.title)}
                />
                <LatestRow
                  glyph="♪"
                  glyphColor="blue"
                  label="Listen"
                  title={show?.name ?? 'Pray the Rosary with us'}
                  meta={show?.category ?? 'Daily Prayer'}
                  image={mediaUrl(show?.thumbnail)}
                  onPress={() => router.push('/listen')}
                />
                <LatestRow
                  glyph="☰"
                  glyphColor="blue"
                  label="Read"
                  title={article?.title ?? 'Stories to carry into your day'}
                  meta={joinMeta(
                    article?.categories?.[0]?.name ?? 'Catholic formation',
                    formatShortDate(article?.published_at),
                  )}
                  image={mediaUrl(article?.image)}
                  onPress={() => openArticle('read', article?.url, article?.title)}
                />
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    </ScrollView>
    </ScreenBackground>
  );
}

function joinMeta(...parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(' · ');
}

function LiveBanner({ title }: { title: string }) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push('/live')}
      style={({ pressed }) => [
        styles.liveBanner,
        { borderColor: theme.live, backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <View style={styles.liveBadgeGroup}>
        <View style={[styles.liveDot, { backgroundColor: theme.live }]} />
        <ThemedText style={[styles.liveLabel, { color: theme.live }]}>LIVE</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.liveTitle} numberOfLines={1}>
        {title}
      </ThemedText>
      <Ionicons name="chevron-forward" size={16} color={theme.gold} />
    </Pressable>
  );
}

function FounderCard({
  avatar,
  quote,
}: {
  avatar: string | null;
  quote: { text: string; source: string };
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.founderCard,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          borderLeftColor: theme.gold,
          borderLeftWidth: 3.5,
        },
      ]}>
      <View style={styles.founderHead}>
        <View style={[styles.founderAvatar, { borderColor: theme.gold, backgroundColor: theme.goldSoft }]}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <ThemedText themeColor="gold" style={styles.founderAvatarGlyph}>
              ✝
            </ThemedText>
          )}
        </View>
        <View style={styles.founderHeadText}>
          <ThemedText style={styles.founderName}>Fr. Morson Livingston</ThemedText>
          <ThemedText themeColor="gold" style={styles.founderRole}>
            FOUNDER · ALL CATHOLIC MEDIA
          </ThemedText>
        </View>
      </View>

      <View style={[styles.founderQuote, { borderLeftColor: theme.goldSoft }]}>
        <ThemedText style={styles.founderQuoteText}>“{quote.text}”</ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.founderQuoteSource}>
          — {quote.source.toUpperCase()}
        </ThemedText>
      </View>
    </View>
  );
}

function ContinueCard({
  video,
  label = 'CONTINUE WATCHING',
  onPress,
}: {
  video?: HeroVideo | undefined;
  label?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();
  const title = video?.title ?? 'A reflection for the week ahead';
  const source = video?.channel ?? 'All Catholic Media';
  const duration = formatDuration(video?.duration) ?? '18 min';

  return (
    <Pressable
      onPress={onPress ?? (() => router.push('/live'))}
      style={({ pressed }) => [
        styles.continueCard,
        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.thumb, { backgroundColor: theme.backgroundSelected }]}>
        {video?.thumbnail ? (
          <Image
            source={{ uri: video.thumbnail }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : null}
        <View style={[styles.playButton, { backgroundColor: theme.gold }]}>
          <Ionicons name="play" size={20} color="#ffffff" style={{ marginLeft: 2 }} />
        </View>
        {/* Progress fill cosmetic track */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { backgroundColor: theme.gold }]} />
        </View>
      </View>
      <View style={styles.continueBody}>
        <ThemedText themeColor="blue" style={styles.typeLabel}>
          {label}
        </ThemedText>
        <ThemedText style={styles.continueTitle} numberOfLines={2}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.metaText}>
          {joinMeta(source, duration)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function PreviewCard({
  label,
  title,
  image,
  fallbackSymbol,
  isVideo = false,
  onPress,
}: {
  label: string;
  title: string;
  image?: string | null;
  fallbackSymbol: string;
  isVideo?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.previewCard,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.previewThumb, { backgroundColor: theme.backgroundSelected }]}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <ThemedText themeColor="gold" style={styles.previewGlyph}>
            {fallbackSymbol}
          </ThemedText>
        )}
        {isVideo ? (
          <View style={[styles.previewPlay, { backgroundColor: theme.gold }]}>
            <Ionicons name="play" size={14} color="#ffffff" style={{ marginLeft: 2 }} />
          </View>
        ) : null}
      </View>
      <View style={styles.previewBody}>
        <ThemedText themeColor="blue" style={styles.typeLabel}>
          {label}
        </ThemedText>
        <ThemedText style={styles.previewTitle} numberOfLines={2}>
          {title}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function LatestRow({
  glyph,
  glyphColor,
  label,
  title,
  meta,
  image,
  isVideo = false,
  onPress,
}: {
  glyph: string;
  glyphColor: 'gold' | 'blue';
  label: string;
  title: string;
  meta: string;
  image?: string | null;
  isVideo?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.latestRow,
        { borderColor: theme.border, backgroundColor: theme.backgroundElement },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.latestThumb,
          { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
        ]}>
        {image ? (
          <Image
            source={{ uri: image }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <ThemedText themeColor={glyphColor} style={styles.latestThumbGlyph}>
            {glyph}
          </ThemedText>
        )}
        {isVideo ? (
          <View style={[styles.latestPlay, { backgroundColor: theme.gold }]}>
            <Ionicons name="play" size={10} color="#ffffff" style={{ marginLeft: 1 }} />
          </View>
        ) : null}
      </View>
      <View style={styles.latestCopy}>
        <ThemedText themeColor="blue" style={styles.typeLabel}>
          {label.toUpperCase()}
        </ThemedText>
        <ThemedText style={styles.latestTitle} numberOfLines={2}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.metaText} numberOfLines={1}>
          {meta}
        </ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
    </Pressable>
  );
}

const CARD_SHADOW = {
  shadowColor: 'rgba(0, 0, 0, 0.08)',
  shadowOpacity: 0.6,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
} as const;

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  transparent: { flex: 1, backgroundColor: 'transparent' },
  safe: { paddingBottom: BottomTabInset + Spacing.four },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, gap: Spacing.two + 2 },

  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    ...CARD_SHADOW,
  },
  liveBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  liveTitle: { flex: 1, fontSize: 13 },

  greeting: { fontFamily: Fonts.serif, fontWeight: '700', fontSize: 24, lineHeight: 28, color: '#f3f6fa' },
  intro: { marginTop: 2, color: 'rgba(243, 246, 250, 0.75)' },

  founderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two + 2,
    ...CARD_SHADOW,
  },
  founderHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  founderAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  founderAvatarGlyph: { fontSize: 20 },
  founderHeadText: { flex: 1, minWidth: 0, gap: 1 },
  founderName: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 18,
  },
  founderRole: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8 },
  founderQuote: { borderLeftWidth: 2, paddingLeft: Spacing.two + 2, gap: 2 },
  founderQuoteText: {
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 20,
  },
  founderQuoteSource: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  continueCard: { borderRadius: 14, borderWidth: 1, overflow: 'hidden', ...CARD_SHADOW },
  thumb: { height: 130, alignItems: 'center', justifyContent: 'center' },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressFill: { width: '64%', height: 3 },
  continueBody: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, gap: 2 },
  typeLabel: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.6 },
  continueTitle: { fontSize: 14.5, lineHeight: 19, fontWeight: '700' },
  metaText: { fontSize: 11.5, lineHeight: 15 },

  dualCards: { flexDirection: 'row', gap: Spacing.two },
  previewCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  previewThumb: { height: 88, alignItems: 'center', justifyContent: 'center' },
  previewGlyph: { fontSize: 24, lineHeight: 28 },
  previewPlay: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBody: { paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.two, gap: 2 },
  previewTitle: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 17,
  },

  latestHeading: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 17,
    lineHeight: 22,
    color: '#f3f6fa',
    marginBottom: Spacing.one,
  },
  latestList: { gap: Spacing.two },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    padding: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    ...CARD_SHADOW,
  },
  latestThumb: {
    width: 70,
    height: 52,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestThumbGlyph: { fontSize: 16, lineHeight: 20 },
  latestPlay: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestCopy: { flex: 1, minWidth: 0, gap: 1 },
  latestTitle: { fontSize: 13.5, fontWeight: '600', lineHeight: 17 },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
