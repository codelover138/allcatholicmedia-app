import { apiRequest } from '@/lib/api-client';

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
    meta: PaginationMeta;
  };
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
  duration: string | null;
  episode_number: number | null;
  is_featured: boolean;
  published_at: string | null;
};

export type ListenDetailResponse = {
  data: {
    show: PodcastShowDTO;
    episodes: PodcastEpisodeDTO[];
    meta: PaginationMeta;
  };
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

export type PrayerRequestInput = {
  full_name: string;
  email: string;
  mobile_number?: string;
  location?: string;
  intention: string;
  is_private?: boolean;
  allow_follow_up?: boolean;
};

export type PrayerRequestResponse = {
  message: string;
  data: {
    id: number;
    status: string;
    submitted_at: string | null;
  };
};

export const appContentApi = {
  home: () => apiRequest<HomeResponse>('/home'),

  channels: () => apiRequest<{ data: ChannelDTO[] }>('/channels'),

  channelDetail: (slug: string) => apiRequest<ChannelDetailResponse>(`/channels/${slug}`),

  listen: (params?: { category?: string; sort?: 'name' | 'episodes' }) =>
    apiRequest<ListenResponse>('/listen', { query: params }),

  listenDetail: (slug: string) => apiRequest<ListenDetailResponse>(`/listen/${slug}`),

  liveNow: () => apiRequest<LiveNowResponse>('/live-now'),

  read: (params?: { category?: number; q?: string; sort?: 'latest' | 'popular'; page?: number }) =>
    apiRequest<ReadResponse>('/read', { query: params }),

  saints: (params?: { q?: string; letter?: string; page?: number }) =>
    apiRequest<SaintsResponse>('/saints', { query: params }),

  donateConfig: () => apiRequest<DonateConfigResponse>('/donate/config'),

  submitPrayerRequest: (input: PrayerRequestInput) =>
    apiRequest<PrayerRequestResponse>('/prayer-requests', { method: 'POST', body: input }),
};
