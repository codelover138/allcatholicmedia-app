import Constants from 'expo-constants';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

// `expo-notifications` was stripped of its push code in Expo Go (SDK 53+) and
// **throws on load** there (Android especially). It's also inert on web. Every
// access to it must go through `getNotifications()` so a missing/broken module
// degrades to a no-op instead of crashing app start.
const isExpoGo =
  (Constants.appOwnership as string | null) === 'expo' ||
  (Constants.executionEnvironment as string | undefined) === 'storeClient';

export const notificationsSupported = Platform.OS !== 'web' && !isExpoGo;

let cached: NotificationsModule | null | undefined;

/** The expo-notifications module, or null when it can't be used here. */
export function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (!notificationsSupported) {
    cached = null;
    return cached;
  }
  try {
    // Required lazily — never evaluated during app start, so an Expo Go throw
    // can't take down the bundle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}

let handlerSet = false;

/** Install the foreground-presentation handler once, if notifications are available. */
export function ensureNotificationHandler(): void {
  if (handlerSet) return;
  const N = getNotifications();
  if (!N) return;
  handlerSet = true;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Ask for notification permission. Returns false when unavailable or denied. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  try {
    const existing = await N.getPermissionsAsync();
    if (existing.status === 'granted') return true;
    const req = await N.requestPermissionsAsync();
    return req.status === 'granted';
  } catch {
    return false;
  }
}
