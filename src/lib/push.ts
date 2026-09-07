import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { ApiError } from '@/lib/api-client';
import { accountApi } from '@/lib/auth-api';
import {
  ensureNotificationHandler,
  ensureNotificationPermission,
  getNotifications,
} from '@/lib/notifications';

export { ensureNotificationPermission };

const projectId =
  Constants.expoConfig?.extra?.eas?.projectId ??
  (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

// Remember the last token we registered so we can unregister it on sign-out
// without re-hitting the notification APIs.
let lastRegisteredToken: string | null = null;

async function getExpoPushToken(): Promise<string | null> {
  const N = getNotifications();
  if (!N || !Device.isDevice) return null; // Expo Go / web / simulator

  ensureNotificationHandler();

  try {
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', {
        name: 'General',
        importance: N.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C9A227',
      });
    }

    if (!(await ensureNotificationPermission())) return null;

    const { data } = await N.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return data;
  } catch {
    return null;
  }
}

/** Called once the member is authenticated: get a token and register the device. */
export async function syncPushRegistration(): Promise<void> {
  try {
    const token = await getExpoPushToken();
    if (!token || token === lastRegisteredToken) return;

    await accountApi.registerDevice({
      token,
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : undefined,
      app_version: Constants.expoConfig?.version ?? undefined,
    });
    lastRegisteredToken = token;
  } catch (err) {
    // A 401 means the session is already gone — nothing to register.
    if (!(err instanceof ApiError && err.status === 401)) {
      // Non-fatal: push is a nice-to-have, not a blocker for using the app.
      console.warn('Push registration failed', err);
    }
  }
}

/** Called on sign-out (while the token is still valid) to detach this device. */
export async function clearPushRegistration(): Promise<void> {
  const token = lastRegisteredToken;
  lastRegisteredToken = null;
  if (!token) return;
  try {
    await accountApi.unregisterDevice(token);
  } catch {
    /* best effort */
  }
}
