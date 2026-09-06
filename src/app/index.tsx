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
        { borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.liveDot} />
      <ThemedText style={styles.liveLabel}>LIVE</ThemedText>
      <ThemedText type="small" style={styles.liveTitle} numberOfLines={1}>
        {title}
      </ThemedText>
      <ThemedText style={styles.liveArrow}>›</ThemedText>
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
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.founderHead}>
        <View style={[styles.founderAvatar, { borderColor: theme.gold, backgroundColor: theme.backgroundSelected }]}>
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

      <View style={[styles.founderQuote, { borderLeftColor: theme.gold }]}>
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
        <View style={styles.playButton}>
          <ThemedText style={styles.playGlyph}>▶</ThemedText>
        </View>
        {/* Progress fill is cosmetic until real playback state exists (no auth yet). */}
        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
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
          <View style={styles.previewPlay}>
            <ThemedText style={styles.previewPlayGlyph}>▶</ThemedText>
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
          <View style={styles.latestPlay}>
            <ThemedText style={styles.latestPlayGlyph}>▶</ThemedText>
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
      <ThemedText themeColor="textSecondary" style={styles.latestChevron}>
        ›
      </ThemedText>
    </Pressable>
  );
}

// Lifts cards off the deep-navy page background the way the design's 1px border
// + soft shadow does on the light theme.
const CARD_SHADOW = {
  shadowColor: '#00030b',
  shadowOpacity: 0.5,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
} as const;

const styles = StyleSheet.create({
  scroll: { flexGrow: 1 },
  transparent: { flex: 1, backgroundColor: 'transparent' },
  safe: { paddingBottom: BottomTabInset + Spacing.four },
  content: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, gap: Spacing.three },

  liveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#060e1d',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    ...CARD_SHADOW,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e5484d' },
  liveLabel: { color: '#ffffff', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  liveTitle: { flex: 1, color: '#e7ecf3' },
  liveArrow: { color: '#c9a227', fontSize: 20, lineHeight: 22 },

  greeting: { fontFamily: Fonts.serif, fontWeight: '700', fontSize: 26, lineHeight: 32, color: '#f3f6fa' },
  intro: { marginTop: Spacing.half },

  founderCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.three,
    ...CARD_SHADOW,
  },
  founderHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  founderAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  founderAvatarGlyph: { fontSize: 22 },
  founderHeadText: { flex: 1, minWidth: 0, gap: 2 },
  founderName: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
    color: '#f3f6fa',
  },
  founderRole: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8 },
  founderQuote: { borderLeftWidth: 2, paddingLeft: Spacing.three, gap: Spacing.one },
  founderQuoteText: {
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
    fontSize: 15,
    lineHeight: 22,
    color: '#e7ecf3',
  },
  founderQuoteSource: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8 },

  continueCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', ...CARD_SHADOW },
  thumb: { height: 140, alignItems: 'center', justifyContent: 'center' },
  playButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(201,162,39,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlyph: { color: '#0d1f3c', fontSize: 18, marginLeft: 3 },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  progressFill: { width: '64%', height: 3, backgroundColor: '#c9a227' },
  continueBody: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2, gap: 3 },
  typeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.6 },
  continueTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700', color: '#f3f6fa' },
  metaText: { fontSize: 12, lineHeight: 16 },

  dualCards: { flexDirection: 'row', gap: Spacing.two + 2 },
  previewCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  previewThumb: { height: 92, alignItems: 'center', justifyContent: 'center' },
  previewGlyph: { fontSize: 26, lineHeight: 30 },
  previewPlay: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(201,162,39,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewPlayGlyph: { color: '#0d1f3c', fontSize: 13, marginLeft: 2 },
  previewBody: { paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.two, gap: 2 },
  previewTitle: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 13.5,
    lineHeight: 18,
    color: '#f3f6fa',
  },

  latestHeading: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#f3f6fa',
    marginBottom: Spacing.two + 2,
  },
  latestList: { gap: Spacing.two + 2 },
  latestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two + 2,
    borderRadius: 12,
    borderWidth: 1,
    ...CARD_SHADOW,
  },
  latestThumb: {
    width: 76,
    height: 56,
    borderRadius: 9,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestThumbGlyph: { fontSize: 18, lineHeight: 22 },
  latestPlay: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(201,162,39,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  latestPlayGlyph: { color: '#0d1f3c', fontSize: 10, marginLeft: 2 },
  latestCopy: { flex: 1, minWidth: 0, gap: 1 },
  latestTitle: { fontSize: 14, fontWeight: '600', lineHeight: 18, color: '#f3f6fa' },
  latestChevron: { fontSize: 20, lineHeight: 22 },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
