import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { ApiError } from '@/lib/api-client';
import { authApi, type Member } from '@/lib/auth-api';
import { useAuth } from '@/lib/auth-store';

// ── Config. Client IDs come from EXPO_PUBLIC_* env vars (see .env.example); the
//    button stays hidden until at least the web client id is set AND the backend
//    Social Login plugin has Google configured with the same id.
const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';

const isExpoGo =
  (Constants.appOwnership as string | null) === 'expo' ||
  (Constants.executionEnvironment as string | undefined) === 'storeClient';

/** True once client ids are provided — controls whether the button is rendered. */
export const googleAuthConfigured = webClientId.length > 0;

/** True only where the native module can actually run (dev/prod build, not Expo Go / web). */
export const googleAuthPlatformSupported = Platform.OS !== 'web' && !isExpoGo;

// ── Lazy native module. `@react-native-google-signin/google-signin` is a native
//    module and isn't linked in Expo Go — never import it at module scope.
type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');
let mod: GoogleSigninModule | null | undefined;
let didConfigure = false;

function loadModule(): GoogleSigninModule | null {
  if (mod !== undefined) return mod;
  if (!googleAuthConfigured || !googleAuthPlatformSupported) {
    mod = null;
    return mod;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  } catch {
    mod = null;
  }
  return mod;
}

export type GoogleSignInResult =
  | { ok: true }
  | { ok: false; cancelled?: boolean; message: string };

/**
 * Full "Continue with Google" flow: native Google Sign-In → ID token →
 * `POST /api/v1/auth/google` → store the Sanctum token → refresh the member
 * profile. Safe to call from any screen.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!googleAuthConfigured) {
    return { ok: false, message: 'Google sign-in isn’t set up for this app yet.' };
  }
  if (!googleAuthPlatformSupported) {
    return { ok: false, message: 'Google sign-in needs the full app — it doesn’t run in Expo Go or on the web.' };
  }

  const m = loadModule();
  if (!m) {
    return { ok: false, message: 'Google sign-in isn’t available in this build.' };
  }

  const { GoogleSignin, statusCodes } = m;

  try {
    if (!didConfigure) {
      GoogleSignin.configure({
        webClientId,
        iosClientId: iosClientId || undefined,
        offlineAccess: false,
      });
      didConfigure = true;
    }

    if (Platform.OS === 'android') {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const response = await GoogleSignin.signIn();

    // v13+: { type: 'success' | 'cancelled', data }. Older: { idToken, user }.
    const r = response as unknown as {
      type?: string;
      data?: { idToken?: string | null; user?: { id?: string; name?: string; email?: string } } | null;
      idToken?: string | null;
      user?: { id?: string; name?: string; email?: string };
    };
    if (r.type === 'cancelled') return { ok: false, cancelled: true, message: 'Cancelled.' };

    const idToken = r.data?.idToken ?? r.idToken ?? null;
    if (!idToken) return { ok: false, message: 'Google did not return a sign-in token.' };

    const res = await authApi.googleLogin(idToken);
    const token = res.data?.token;
    if (!token) return { ok: false, message: res.message || 'Google sign-in was rejected by the server.' };

    // Seed a minimal member from Google, then refresh the full profile.
    const g = res.data!.user;
    const [first, ...rest] = (g.name ?? '').trim().split(/\s+/).filter(Boolean);
    const minimal: Member = {
      id: g.id,
      email: g.email,
      name: g.name ?? null,
      first_name: first ?? null,
      last_name: rest.length ? rest.join(' ') : null,
      phone: null,
      avatar: null,
      email_verified: true,
      created_at: null,
      updated_at: null,
    };
    await useAuth.getState().signIn(token, minimal);

    try {
      const me = await authApi.me();
      useAuth.getState().setMember(me.data.member);
    } catch {
      /* keep the minimal profile — next app open will refresh it */
    }

    return { ok: true };
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code && statusCodes) {
      if (code === statusCodes.SIGN_IN_CANCELLED) return { ok: false, cancelled: true, message: 'Cancelled.' };
      if (code === statusCodes.IN_PROGRESS) return { ok: false, message: 'A sign-in is already in progress.' };
      if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return { ok: false, message: 'Google Play Services isn’t available on this device.' };
      }
    }
    if (err instanceof ApiError) return { ok: false, message: err.message };
    return { ok: false, message: 'Could not sign in with Google. Please try again.' };
  }
}

/** Best-effort sign-out from the Google session (call alongside app sign-out). */
export async function signOutGoogle(): Promise<void> {
  const m = loadModule();
  try {
    await m?.GoogleSignin.signOut();
  } catch {
    /* ignore */
  }
}
