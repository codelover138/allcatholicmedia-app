import { API_V1_ROOT_URL, apiRequest } from '@/lib/api-client';

// Mirrors App\Http\Resources\Api\MemberResource in ../allcatholicmedia.
export type Member = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  avatar_thumb?: string | null;
  email_verified: boolean;
  created_at: string | null;
  updated_at: string | null;
  // account/show adds these optional profile fields
  dob?: string | null;
  gender?: string | null;
  description?: string | null;
};

type Envelope<T> = { data: T };
type Paginated<T> = {
  data: T[];
  meta: {
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
      has_more: boolean;
    };
  };
};

export type TokenPayload = { token: string; token_type: 'Bearer'; member: Member };
export type RegisterPending = { member: Member; requires_verification: true; message: string };

export type LoginInput = { email: string; password: string; device_name?: string };

// The Botble Social Login plugin uses its own `{ error, data, message }` envelope
// (not the app's v1 shape). Success carries a Sanctum token compatible with the
// rest of the API.
export type SocialLoginResponse = {
  error: boolean;
  data: { token: string; user: { id: number; name: string | null; email: string } } | null;
  message: string;
};
export type RegisterInput = {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  device_name?: string;
};

export type MemberActivity = {
  id: number;
  action: string;
  description: string;
  reference_url: string | null;
  reference_name: string | null;
  created_at: string | null;
};

export type Donation = {
  id: number;
  amount: number;
  currency: string;
  formatted_amount: string;
  status: string;
  message: string | null;
  created_at: string | null;
};

export type MemberPrayerRequest = {
  id: number;
  intention: string;
  is_private: boolean;
  visibility?: 'only_me' | 'prayer_team' | 'community';
  status: string;
  created_at: string | null;
};

export type Bookmark = {
  id: number;
  type: 'article' | 'saint' | 'video' | 'episode' | 'show' | 'channel';
  ref_id: number;
  created_at: string | null;
  item?: {
    title?: string;
    name?: string;
    image?: string | null;
    thumbnail?: string | null;
    url?: string | null;
    slug?: string | null;
    video_url?: string | null;
    [key: string]: unknown;
  } | null;
};

export type AuthSession = {
  id: number;
  name: string;
  current: boolean;
  last_used_at: string | null;
  created_at: string | null;
};

export const authApi = {
  login: (input: LoginInput) =>
    apiRequest<Envelope<TokenPayload>>('/auth/login', {
      method: 'POST',
      body: input,
      anonymous: true,
      baseUrl: API_V1_ROOT_URL,
    }),

  register: (input: RegisterInput) =>
    apiRequest<Envelope<TokenPayload | RegisterPending>>('/auth/register', {
      method: 'POST',
      body: input,
      anonymous: true,
      baseUrl: API_V1_ROOT_URL,
    }),

  /** Botble Social Login plugin — exchange a Google ID token for a Sanctum token. */
  googleLogin: (identityToken: string) =>
    apiRequest<SocialLoginResponse>('/auth/google', {
      method: 'POST',
      body: { identityToken, guard: 'member' },
      anonymous: true,
      baseUrl: API_V1_ROOT_URL,
    }),

  /** Botble Social Login plugin — exchange an Apple identity token for a Sanctum token. */
  appleLogin: (identityToken: string) =>
    apiRequest<SocialLoginResponse>('/auth/apple', {
      method: 'POST',
      body: { identityToken, guard: 'member' },
      anonymous: true,
      baseUrl: API_V1_ROOT_URL,
    }),

  forgotPassword: (email: string) =>
    apiRequest<Envelope<{ message: string }>>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
      anonymous: true,
      baseUrl: API_V1_ROOT_URL,
    }),

  resendVerification: (email: string) =>
    apiRequest<Envelope<{ message: string }>>('/auth/resend-verification', {
      method: 'POST',
      body: { email },
      anonymous: true,
      baseUrl: API_V1_ROOT_URL,
    }),

  me: () => apiRequest<Envelope<{ member: Member }>>('/auth/me', { baseUrl: API_V1_ROOT_URL }),

  logout: () =>
    apiRequest<Envelope<{ message: string }>>('/auth/logout', {
      method: 'POST',
      baseUrl: API_V1_ROOT_URL,
    }),

  changePassword: (input: {
    current_password: string;
    password: string;
    password_confirmation: string;
    logout_other_devices?: boolean;
  }) =>
    apiRequest<Envelope<{ message: string }>>('/auth/change-password', {
      method: 'POST',
      body: input,
      baseUrl: API_V1_ROOT_URL,
    }),
};

export const accountApi = {
  show: () => apiRequest<Envelope<{ member: Member }>>('/account', { baseUrl: API_V1_ROOT_URL }),

  update: (input: Partial<Pick<Member, 'first_name' | 'last_name' | 'phone' | 'dob' | 'gender' | 'description'>>) =>
    apiRequest<Envelope<{ member: Member }>>('/account', {
      method: 'PUT',
      body: input,
      baseUrl: API_V1_ROOT_URL,
    }),

  updateAvatar: (file: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    // React Native's FormData accepts this shape for file parts.
    form.append('avatar', file as unknown as Blob);
    return apiRequest<Envelope<{ member: Member }>>('/account/avatar', {
      method: 'POST',
      form,
      baseUrl: API_V1_ROOT_URL,
    });
  },

  registerDevice: (input: { token: string; platform?: 'ios' | 'android'; app_version?: string }) =>
    apiRequest<Envelope<{ message: string }>>('/account/devices', {
      method: 'POST',
      body: input,
      baseUrl: API_V1_ROOT_URL,
    }),

  unregisterDevice: (token: string) =>
    apiRequest<Envelope<{ message: string }>>('/account/devices', {
      method: 'DELETE',
      body: { token },
      baseUrl: API_V1_ROOT_URL,
    }),

  destroy: () =>
    apiRequest<Envelope<{ message: string }>>('/account', {
      method: 'DELETE',
      body: { confirm: true },
      baseUrl: API_V1_ROOT_URL,
    }),

  activities: (page = 1) =>
    apiRequest<Paginated<MemberActivity>>('/account/activities', {
      query: { page },
      baseUrl: API_V1_ROOT_URL,
    }),

  donations: (page = 1) =>
    apiRequest<Paginated<Donation>>('/account/donations', {
      query: { page },
      baseUrl: API_V1_ROOT_URL,
    }),

  prayerRequests: (page = 1) =>
    apiRequest<Paginated<MemberPrayerRequest>>('/account/prayer-requests', {
      query: { page },
      baseUrl: API_V1_ROOT_URL,
    }),

  bookmarks: (params?: { type?: Bookmark['type']; page?: number }) =>
    apiRequest<Paginated<Bookmark>>('/account/bookmarks', {
      query: { expand: 1, type: params?.type, page: params?.page },
      baseUrl: API_V1_ROOT_URL,
    }),

  addBookmark: (type: Bookmark['type'], ref_id: number) =>
    apiRequest<Envelope<{ id: number; type: string; ref_id: number }>>('/account/bookmarks', {
      method: 'POST',
      body: { type, ref_id },
      baseUrl: API_V1_ROOT_URL,
    }),

  removeBookmark: (type: Bookmark['type'], ref_id: number) =>
    apiRequest<Envelope<{ message: string }>>('/account/bookmarks', {
      method: 'DELETE',
      body: { type, ref_id },
      baseUrl: API_V1_ROOT_URL,
    }),

  sessions: () =>
    apiRequest<Envelope<{ sessions: AuthSession[] }>>('/account/sessions', {
      baseUrl: API_V1_ROOT_URL,
    }),

  revokeSession: (id: number) =>
    apiRequest<Envelope<{ message: string }>>(`/account/sessions/${id}`, {
      method: 'DELETE',
      baseUrl: API_V1_ROOT_URL,
    }),
};

export function isTokenPayload(data: TokenPayload | RegisterPending): data is TokenPayload {
  return 'token' in data;
}
