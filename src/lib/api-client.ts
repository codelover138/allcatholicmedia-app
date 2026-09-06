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

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  token?: string | null;
  baseUrl?: string;
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

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, token, baseUrl } = options;

  const response = await fetch(buildUrl(path, query, baseUrl), {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      isJson && payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : `Request failed with status ${response.status}`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}
