import { Platform } from 'react-native';

/**
 * The Laravel dev server binds to `localhost`, which resolves to the device
 * itself on a physical phone/emulator rather than the host machine. Android
 * emulators reach the host via the special alias `10.0.2.2`; iOS simulator
 * and web can use `localhost` directly. Override with EXPO_PUBLIC_API_BASE_URL
 * for physical-device testing (point it at your machine's LAN IP) or for
 * staging/production builds.
 */
const DEV_HOST = Platform.select({ android: '10.0.2.2', default: 'localhost' });

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://${DEV_HOST}/main/public/api/app`;

// The versioned API (`/api/v1/app/*`) lives alongside the frozen legacy one the
// app was scaffolded against. A handful of endpoints only exist on v1.
export const API_V1_BASE_URL = API_BASE_URL.replace(/\/api\/app\/?$/, '/api/v1/app');

// Auth + member-account endpoints sit directly under `/api/v1` (not `/app`):
// `/api/v1/auth/*`, `/api/v1/account/*`.
export const API_V1_ROOT_URL = API_BASE_URL.replace(/\/api\/app\/?$/, '/api/v1');

export class ApiError extends Error {
  status: number;
  body: unknown;
  /** Machine-readable code from the v1 error envelope, e.g. `email_not_verified`. */
  code?: string;
  /** Field → messages map from a 422, when present. */
  details?: Record<string, string[]>;

  constructor(
    status: number,
    message: string,
    body: unknown,
    code?: string,
    details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.code = code;
    this.details = details;
  }

  /** First validation message for a field, if any. */
  fieldError(field: string): string | undefined {
    return this.details?.[field]?.[0];
  }
}

// ── Ambient auth. The auth store registers a token getter here so every request
//    carries the bearer token without each call site threading it through, plus
//    a handler invoked on a 401 so an expired/revoked token signs the user out.
type TokenProvider = () => string | null | undefined;
let tokenProvider: TokenProvider | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthTokenProvider(provider: TokenProvider | null) {
  tokenProvider = provider;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  /** Explicit bearer token; overrides the ambient one. Pass `null` to send none. */
  token?: string | null;
  /** Skip the ambient token even on authed endpoints (e.g. login). */
  anonymous?: boolean;
  baseUrl?: string;
  /** Pre-built FormData for multipart uploads (avatar). Sent instead of `body`. */
  form?: FormData;
};

function buildUrl(path: string, query?: RequestOptions['query'], baseUrl: string = API_BASE_URL): string {
  const url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

function parseErrorEnvelope(payload: unknown, status: number): {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
} {
  if (payload && typeof payload === 'object') {
    // v1 envelope: { error: { code, message, details? } }
    const err = (payload as { error?: { code?: string; message?: string; details?: unknown } }).error;
    if (err && typeof err === 'object') {
      return {
        message: err.message || `Request failed with status ${status}`,
        code: err.code,
        details: (err.details as Record<string, string[]>) ?? undefined,
      };
    }
    // legacy / Laravel default: { message, errors? }
    const legacy = payload as { message?: string; errors?: Record<string, string[]> };
    if (legacy.message) {
      return { message: legacy.message, details: legacy.errors };
    }
  }
  return { message: `Request failed with status ${status}` };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, token, anonymous, baseUrl, form } = options;

  const ambientToken = anonymous ? null : tokenProvider?.();
  const bearer = token !== undefined ? token : ambientToken;

  const response = await fetch(buildUrl(path, query, baseUrl), {
    method,
    headers: {
      Accept: 'application/json',
      ...(form ? {} : body ? { 'Content-Type': 'application/json' } : {}),
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const { message, code, details } = parseErrorEnvelope(payload, response.status);
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, message, payload, code, details);
  }

  return payload as T;
}
