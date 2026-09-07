import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';

import {
  ApiError,
  setAuthTokenProvider,
  setUnauthorizedHandler,
} from '@/lib/api-client';
import { authApi, type Member } from '@/lib/auth-api';
import { biometricPref } from '@/lib/biometrics';
import { clearPushRegistration, syncPushRegistration } from '@/lib/push';
import { queryClient } from '@/lib/query-client';

const TOKEN_KEY = 'acm.auth.token';

// expo-secure-store has no web implementation; fall back to localStorage there
// (dev/web only — native builds always use the keychain/keystore).
const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* ignore */
      }
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        /* ignore */
      }
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

type AuthStatus = 'loading' | 'authed' | 'guest';

type AuthState = {
  status: AuthStatus;
  token: string | null;
  member: Member | null;
  /** Biometric app-lock preference, mirrored from secure store. */
  biometricEnabled: boolean;
  /** True when the app is authed but waiting for a biometric unlock. */
  locked: boolean;

  hydrate: () => Promise<void>;
  signIn: (token: string, member: Member) => Promise<void>;
  setMember: (member: Member) => void;
  signOut: (opts?: { revokeOnServer?: boolean }) => Promise<void>;

  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  lock: () => void;
  unlock: () => void;
};

export const useAuth = create<AuthState>((set, get) => ({
  status: 'loading',
  token: null,
  member: null,
  biometricEnabled: false,
  locked: false,

  hydrate: async () => {
    const [token, biometricEnabled] = await Promise.all([
      storage.get(TOKEN_KEY),
      biometricPref.read(),
    ]);
    set({ biometricEnabled });

    if (!token) {
      set({ status: 'guest', token: null, member: null, locked: false });
      return;
    }
    set({ token });
    try {
      const res = await authApi.me();
      set({
        status: 'authed',
        token,
        member: res.data.member,
        locked: biometricEnabled,
      });
      void syncPushRegistration();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await storage.remove(TOKEN_KEY);
        set({ status: 'guest', token: null, member: null, locked: false });
      } else {
        set({ status: 'guest', locked: false });
      }
    }
  },

  signIn: async (token, member) => {
    await storage.set(TOKEN_KEY, token);
    // Just authenticated with a password — no biometric gate this session.
    set({ status: 'authed', token, member, locked: false });
    void syncPushRegistration();
  },

  setMember: (member) => set({ member }),

  signOut: async ({ revokeOnServer = true } = {}) => {
    const { token } = get();
    if (revokeOnServer && token) {
      await clearPushRegistration();
      try {
        await authApi.logout();
      } catch {
        /* best effort — token may already be invalid */
      }
    }
    // Lazy require to avoid an auth-store ↔ google-auth import cycle.
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      await (require('./google-auth') as typeof import('./google-auth')).signOutGoogle();
    } catch {
      /* not configured / not a native build */
    }
    await storage.remove(TOKEN_KEY);
    set({ status: 'guest', token: null, member: null, locked: false });
    queryClient.removeQueries({ queryKey: ['account'] });
    queryClient.removeQueries({ queryKey: ['auth'] });
  },

  setBiometricEnabled: async (enabled) => {
    await biometricPref.write(enabled);
    set({ biometricEnabled: enabled });
  },

  lock: () => {
    if (get().status === 'authed' && get().biometricEnabled) set({ locked: true });
  },

  unlock: () => set({ locked: false }),
}));

// Wire the ambient token + global 401 handling into the API client. Done once at
// module load so every request — including those fired before React mounts —
// carries the bearer token.
setAuthTokenProvider(() => useAuth.getState().token);
setUnauthorizedHandler(() => {
  const { status, signOut } = useAuth.getState();
  if (status === 'authed') {
    void signOut({ revokeOnServer: false });
  }
});
