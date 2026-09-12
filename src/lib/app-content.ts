import { API_BASE_URL, API_V1_BASE_URL, apiRequest } from '@/lib/api-client';

// The legacy API returns some image fields as bare storage paths ("marry.png")
// while v1 returns absolute URLs. Normalise both to something <Image> can load.
export function mediaUrl(path: string | null | undefined): string | null {
  const value = (path ?? '').trim();
  if (!value) return null;
  if (/^(https?:)?\/\//i.test(value)) return value;
  try {
    return `${new URL(API_BASE_URL).origin}/storage/${value.replace(/^\/+/, '')}`;
  } catch {
    return null;
  }
}

// Types mirror app/Http/Controllers/Api/AppContentController.php response shapes 1:1.

export type HomeSection = {
  key: string;
  title: string;
  count?: number;
  path: string;
};

export type HomeResponse = {
  data: {
    sections: HomeSection[];
  };
};

// GET /api/v1/app/home/spotlights — the three dynamic cards on the website home
// page, resolved server-side the same way the theme shortcodes do. Any card can
// be null. Mirrors AppContentController::homeSpotlights() in ../main.
// Rosary = the latest upload from the "Daily Rosary Meditations" YouTube channel
// (the same source the website's [latest-daily-rosary] shortcode pulls from).
export type RosarySpotlight = {
  title: string;
  video_url: string | null;
  embed_url: string | null;
  thumbnail: string | null;
  published_at: string | null;
  channel: string;
};

export type SaintSpotlight = {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  image: string | null;
  url: string;
  published_at: string | null;
  is_today: boolean;
};

export type VaticanNewsSpotlight = VideoDTO & {
  channel: { name: string; slug: string; thumbnail: string | null };
};

export type HomeSpotlightsResponse = {
  data: {
    rosary: RosarySpotlight | null;
    saint: SaintSpotlight | null;
    vatican_news: VaticanNewsSpotlight | null;
  };
};

export type VideoDTO = {
  id: number;
  youtube_video_id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  video_url: string | null;
  embed_url: string | null;
  duration: string | null;
  view_count: number;
  is_live: boolean;
  published_at: string | null;
};

export type ChannelDTO = {
  name: string;
  slug: string;
  thumbnail: string | null;
  banner: string | null;
  description: string | null;
  videos_count: number;
  latest_video: VideoDTO | null;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ChannelDetailResponse = {
  data: {
    channel: Omit<ChannelDTO, 'latest_video'>;
    videos: VideoDTO[];
  };
  meta: { pagination: V1Pagination };
};

export type PodcastShowDTO = {
  name: string;
  slug: string;
  thumbnail: string | null;
  banner: string | null;
  description: string | null;
  category: string | null;
  episodes_count: number;
};

export type ListenResponse = {
  data: {
    categories: string[];
    shows: PodcastShowDTO[];
  };
};

export type PodcastEpisodeDTO = {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  audio_url: string | null;
  embed_url: string | null;
  /** ISO-8601 (`PT25M`) on the legacy API, seconds on v1. */
  duration: string | number | null;
  episode_number: number | null;
  is_featured: boolean;
  published_at: string | null;
};

export type V1Pagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  has_more: boolean;
};

export type ListenDetailResponse = {
  data: {
    show: PodcastShowDTO;
    episodes: PodcastEpisodeDTO[];
  };
  meta: { pagination: V1Pagination };
};

export type LiveStreamDTO = {
  id: number;
  title: string;
  embed_url: string | null;
  source_name: string | null;
  location: string | null;
  thumbnail: string | null;
  scheduled_at: string | null;
  is_live: boolean;
};

export type LiveNowResponse = {
  data: {
    live_now: LiveStreamDTO[];
    upcoming: LiveStreamDTO[];
  };
};

export type ArticleCategoryDTO = {
  id: number;
  name: string;
};

export type ArticleDTO = {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  url: string;
  published_at: string | null;
  categories: ArticleCategoryDTO[];
};

export type ReadResponse = {
  data: {
    categories: ArticleCategoryDTO[];
    articles: ArticleDTO[];
    meta: PaginationMeta;
  };
};

export type SaintsResponse = {
  data: {
    available_letters: string[];
    saints: ArticleDTO[];
    meta: PaginationMeta;
  };
};

// GET /api/v1/app/search?q= — grouped matches across every content type.
export type SearchResponse = {
  data: {
    query: string;
    articles: ArticleDTO[];
    saints: ArticleDTO[];
    shows: PodcastShowDTO[];
    channels: ChannelDTO[];
    videos: VideoDTO[];
    episodes: PodcastEpisodeDTO[];
  };
};

// GET /api/v1/app/read/{slug} and /api/v1/app/saints/{slug} — one article/saint
// with full HTML body. Mirrors PostDetailResource in ../main.
export type PostDetailDTO = {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  content: string | null;
  image: string | null;
  image_full: string | null;
  url: string;
  views: number;
  published_at: string | null;
  updated_at: string | null;
  categories?: { id: number; name: string }[];
  tags?: { id: number; name: string }[];
};

// GET/POST /api/v1/app/{read,saints}/{slug}/comments. Mirrors CommentResource
// in ../allcatholicmedia (backed by the `fob-comment` plugin).
export type CommentDTO = {
  id: number;
  author_name: string | null;
  author_avatar: string | null;
  is_member: boolean;
  content: string;
  reply_to: number | null;
  created_at: string | null;
  replies?: CommentDTO[];
};

export type CommentsResponse = {
  data: CommentDTO[];
  meta: { pagination: V1Pagination };
};

export type PostCommentResponse = {
  data: { id: number; status: string; pending: boolean };
};

// GET /api/v1/app/videos — cross-channel "Watch" feed (paginated, optional
// channel/live filter, sort by newest or most-viewed).
export type VideosResponse = {
  data: VideoDTO[];
  meta: { pagination: V1Pagination };
};

/** Last path segment of an ACM blog URL (`…/blog/<slug>`). */
export function slugFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const seg = url.split('?')[0].split('#')[0].replace(/\/+$/, '').split('/').pop();
  return seg || null;
}

export type DonateConfigResponse = {
  data: {
    currency: string;
    minimum_amount: number;
    maximum_amount: number;
    preset_amounts: number[];
    guest_checkout_url: string;
    member_checkout_url: string;
    supports_prayer_message: boolean;
  };
};

export type PrayerVisibility = 'only_me' | 'prayer_team' | 'community';

export type PrayerRequestInput = {
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  intention: string;
  /** Preferred over `is_private`; the backend maps it back to the boolean. */
  visibility?: PrayerVisibility;
  /** Legacy: true = prayer team only; false = public prayer wall. */
  is_private?: boolean;
  allow_follow_up?: boolean;
};

export type PrayerRequestResponse = {
  data: {
    id: number;
    status: string;
    visibility?: PrayerVisibility;
    submitted_at: string | null;
  };
};

export type DonationCheckoutInput = {
  amount: number;
  message?: string;
  /** App deep link PayPal returns to (e.g. from `Linking.createURL`). */
  return_url: string;
  /** Required for guests (no bearer token). */
  donor_name?: string;
  donor_email?: string;
};

export type DonationCheckoutResponse = {
  data: { donation_id: number; approval_url: string };
};

// "Daily Rosary Meditations" YouTube channel — the source the website's
// [latest-daily-rosary] shortcode imports from. Fetched straight from YouTube's
// public feed so the Daily Rosary card works even before the backend
// /home/spotlights endpoint is deployed. (Web dev builds may be blocked by CORS;
// native is fine, and the caller falls back to the CMS category feed.)
const DAILY_ROSARY_FEED_URL =
  'https://www.youtube.com/feeds/videos.xml?channel_id=UCSBn2yNBQKzduwG_OJ72wcQ';

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#0*39;/g, "'")
    .replace(/&#x0*27;/gi, "'")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

export async function fetchLatestRosaryVideo(): Promise<RosarySpotlight | null> {
  const response = await fetch(DAILY_ROSARY_FEED_URL, {
    headers: { Accept: 'application/atom+xml, text/xml' },
  });
  if (!response.ok) return null;

  const xml = await response.text();
  const start = xml.indexOf('<entry>');
  if (start === -1) return null;
  const entry = xml.slice(start, xml.indexOf('</entry>', start));

  const videoId = /<yt:videoId>([\w-]{11})<\/yt:videoId>/.exec(entry)?.[1];
  if (!videoId) return null;

  const title = decodeXmlEntities(/<title>([\s\S]*?)<\/title>/.exec(entry)?.[1] ?? '').trim();
  const channel = decodeXmlEntities(
    /<name>([\s\S]*?)<\/name>/.exec(entry)?.[1] ?? 'Daily Rosary Meditations',
  ).trim();

  return {
    title: title || 'Daily Rosary',
    video_url: `https://www.youtube.com/watch?v=${videoId}`,
    embed_url: `https://www.youtube.com/embed/${videoId}`,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    published_at: /<published>([^<]+)<\/published>/.exec(entry)?.[1] ?? null,
    channel,
  };
}

export const appContentApi = {
  // Home/channels/listen/live-now/read/saints/donate-config all hit the v1
  // content endpoints, not the legacy /api/app/* ones: v1 wraps every one of
  // these in `Cache::remember` (TTLs of 30s for live-now up to 300s for
  // home/channels/listen/saints) with ETag/304 support, while the legacy
  // controller re-runs the underlying queries (including several `count()`
  // calls on `home`) on every single request. Response shapes are a verified
  // superset of the legacy ones (same fields, plus additive `updated_at`/
  // `slug`), so this is a drop-in swap — confirmed against production.
  home: () => apiRequest<HomeResponse>('/home', { baseUrl: API_V1_BASE_URL }),

  homeSpotlights: () =>
    apiRequest<HomeSpotlightsResponse>('/home/spotlights', { baseUrl: API_V1_BASE_URL }),

  latestRosaryVideo: fetchLatestRosaryVideo,

  channels: () => apiRequest<{ data: ChannelDTO[] }>('/channels', { baseUrl: API_V1_BASE_URL }),

  channelDetail: (slug: string, params?: { page?: number }) =>
    apiRequest<ChannelDetailResponse>(`/channels/${slug}`, {
      query: params,
      baseUrl: API_V1_BASE_URL,
    }),

  listen: (params?: { category?: string; sort?: 'name' | 'episodes' }) =>
    apiRequest<ListenResponse>('/listen', { query: params, baseUrl: API_V1_BASE_URL }),

  listenDetail: (slug: string, params?: { page?: number }) =>
    apiRequest<ListenDetailResponse>(`/listen/${slug}`, {
      query: params,
      baseUrl: API_V1_BASE_URL,
    }),

  liveNow: () => apiRequest<LiveNowResponse>('/live-now', { baseUrl: API_V1_BASE_URL }),

  read: (params?: { category?: number; q?: string; sort?: 'latest' | 'popular'; page?: number }) =>
    apiRequest<ReadResponse>('/read', { query: params, baseUrl: API_V1_BASE_URL }),

  saints: (params?: { q?: string; letter?: string; page?: number }) =>
    apiRequest<SaintsResponse>('/saints', { query: params, baseUrl: API_V1_BASE_URL }),

  search: (q: string) =>
    apiRequest<SearchResponse>('/search', { query: { q }, baseUrl: API_V1_BASE_URL }),

  articleDetail: (slug: string) =>
    apiRequest<{ data: PostDetailDTO }>(`/read/${encodeURIComponent(slug)}`, {
      baseUrl: API_V1_BASE_URL,
    }),

  saintDetail: (slug: string) =>
    apiRequest<{ data: PostDetailDTO }>(`/saints/${encodeURIComponent(slug)}`, {
      baseUrl: API_V1_BASE_URL,
    }),

  donateConfig: () =>
    apiRequest<DonateConfigResponse>('/donate/config', { baseUrl: API_V1_BASE_URL }),

  submitPrayerRequest: (input: PrayerRequestInput) =>
    apiRequest<PrayerRequestResponse>('/prayer-requests', {
      method: 'POST',
      body: input,
      baseUrl: API_V1_BASE_URL,
    }),

  // Native donation checkout. Falls back to `donate/config`'s hosted page in the
  // UI when this endpoint isn't deployed yet (404) or PayPal is unavailable.
  createDonationCheckout: (input: DonationCheckoutInput) =>
    apiRequest<DonationCheckoutResponse>('/donate/checkout', {
      method: 'POST',
      body: input,
      baseUrl: API_V1_BASE_URL,
    }),

  comments: (kind: 'read' | 'saints', slug: string, page = 1) =>
    apiRequest<CommentsResponse>(`/${kind}/${encodeURIComponent(slug)}/comments`, {
      query: { page },
      baseUrl: API_V1_BASE_URL,
    }),

  // Members only — the backend requires a bearer token (`auth:sanctum`) on
  // this route; guests are prompted to sign in before the composer appears.
  postComment: (kind: 'read' | 'saints', slug: string, content: string, replyTo?: number) =>
    apiRequest<PostCommentResponse>(`/${kind}/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      body: { content, reply_to: replyTo },
      baseUrl: API_V1_BASE_URL,
    }),

  videos: (params?: { channel?: string; live?: boolean; sort?: 'views'; q?: string; page?: number }) =>
    apiRequest<VideosResponse>('/videos', { query: params, baseUrl: API_V1_BASE_URL }),

  subscribeNewsletter: (email: string, name?: string) =>
    apiRequest<{ data: { message: string } }>('/newsletter/subscribe', {
      method: 'POST',
      body: { email, name },
      anonymous: true,
      baseUrl: API_V1_BASE_URL,
    }),

  // Reuses the website's Contact plugin on the backend — needs the new
  // `POST /api/v1/app/contact` route deployed there before this works.
  submitContact: (input: {
    name: string;
    email: string;
    content: string;
    subject?: string;
    agree_terms_and_policy?: boolean;
  }) =>
    apiRequest<{ data: { message: string } }>('/contact', {
      method: 'POST',
      body: input,
      anonymous: true,
      baseUrl: API_V1_BASE_URL,
    }),
};
