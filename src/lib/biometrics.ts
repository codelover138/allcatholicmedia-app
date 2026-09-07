import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const PREF_KEY = 'acm.auth.biometric';

async function readPref(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return (await SecureStore.getItemAsync(PREF_KEY)) === '1';
  } catch {
    return false;
  }
}

async function writePref(enabled: boolean): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (enabled) await SecureStore.setItemAsync(PREF_KEY, '1');
    else await SecureStore.deleteItemAsync(PREF_KEY);
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

/** A friendly name for whatever biometric the device offers. */
export async function biometricLabel(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'face unlock';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Touch ID' : 'fingerprint';
    }
  } catch {
    /* fall through */
  }
  return 'biometrics';
}

export async function promptBiometric(reason = 'Unlock All Catholic Media'): Promise<boolean> {
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

export const biometricPref = { read: readPref, write: writePref };
