import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { Member } from '@/lib/auth-api';

const PREF_KEY = 'acm.auth.biometric';
const BIO_TOKEN_KEY = 'acm.auth.bio_token';
const BIO_MEMBER_KEY = 'acm.auth.bio_member';
const BIO_EMAIL_KEY = 'acm.auth.bio_email';

export type BiometricKind = 'face' | 'fingerprint' | 'iris' | 'biometric';

export type BiometricCredentials = {
  token: string;
  member: Member;
  email: string;
};

// Web fallback helper
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

async function readPref(): Promise<boolean> {
  try {
    return (await storage.get(PREF_KEY)) === '1';
  } catch {
    return false;
  }
}

async function writePref(enabled: boolean): Promise<void> {
  try {
    if (enabled) await storage.set(PREF_KEY, '1');
    else await storage.remove(PREF_KEY);
  } catch {
    /* ignore */
  }
}

/** True when the device has enrolled biometrics (Face ID / Touch ID / fingerprint). */
export async function biometricAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const [hasHardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

/** Specific biometric sensor type (face, fingerprint, iris). */
export async function biometricKind(): Promise<BiometricKind> {
  if (Platform.OS === 'web') return 'biometric';
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
  } catch {
    /* fallback */
  }
  return 'biometric';
}

/** A friendly name for whatever biometric the device offers. */
export async function biometricLabel(): Promise<string> {
  const kind = await biometricKind();
  switch (kind) {
    case 'face':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case 'iris':
      return 'Iris Unlock';
    default:
      return 'Biometrics';
  }
}

/** Prompt the native biometric modal (Face ID / Touch ID / fingerprint). */
export async function promptBiometric(reason = 'Authenticate with All Catholic Media'): Promise<boolean> {
  if (Platform.OS === 'web') return true;
  try {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return res.success;
  } catch {
    return false;
  }
}

/** Save member credentials in SecureStore for Face ID / Biometric login. */
export async function saveBiometricCredentials(creds: BiometricCredentials): Promise<void> {
  try {
    await Promise.all([
      storage.set(BIO_TOKEN_KEY, creds.token),
      storage.set(BIO_MEMBER_KEY, JSON.stringify(creds.member)),
      storage.set(BIO_EMAIL_KEY, creds.email),
      writePref(true),
    ]);
  } catch (err) {
    console.warn('Failed to save biometric credentials:', err);
  }
}

/** Retrieve saved biometric credentials from SecureStore. */
export async function getBiometricCredentials(): Promise<BiometricCredentials | null> {
  try {
    const [token, memberJson, email] = await Promise.all([
      storage.get(BIO_TOKEN_KEY),
      storage.get(BIO_MEMBER_KEY),
      storage.get(BIO_EMAIL_KEY),
    ]);

    if (!token || !memberJson) return null;
    const member = JSON.parse(memberJson) as Member;
    return { token, member, email: email ?? member.email };
  } catch {
    return null;
  }
}

/** True when biometric credentials have been stored on this device. */
export async function hasBiometricCredentials(): Promise<boolean> {
  try {
    const token = await storage.get(BIO_TOKEN_KEY);
    return Boolean(token);
  } catch {
    return false;
  }
}

/** Clear saved biometric credentials from SecureStore. */
export async function clearBiometricCredentials(): Promise<void> {
  try {
    await Promise.all([
      storage.remove(BIO_TOKEN_KEY),
      storage.remove(BIO_MEMBER_KEY),
      storage.remove(BIO_EMAIL_KEY),
      writePref(false),
    ]);
  } catch (err) {
    console.warn('Failed to clear biometric credentials:', err);
  }
}

/** Authenticate via native prompt and return the saved token and member. */
export async function authenticateWithBiometrics(reason?: string): Promise<BiometricCredentials | null> {
  const creds = await getBiometricCredentials();
  if (!creds) return null;

  const label = await biometricLabel();
  const ok = await promptBiometric(reason ?? `Sign in with ${label}`);
  if (!ok) return null;

  return creds;
}

export const biometricPref = { read: readPref, write: writePref };

