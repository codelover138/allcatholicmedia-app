import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { ensureNotificationPermission } from '@/lib/push';

// Local (on-device) prayer reminders. No backend — these are scheduled straight
// into the OS notification queue and survive app restarts, so we just re-apply
// the whole schedule whenever the member changes a preference.

const PREF_KEY = 'acm.reminders';
const TAG = 'acm.reminder'; // marks our notifications so we can clear only ours

export type ReminderKind = 'rosary' | 'mass';

export type ReminderPrefs = {
  rosary: { enabled: boolean; hour: number; minute: number };
  /** Sunday Mass. `weekday` is 1-7 with 1 = Sunday, per expo-notifications. */
  mass: { enabled: boolean; weekday: number; hour: number; minute: number };
};

export const DEFAULT_PREFS: ReminderPrefs = {
  rosary: { enabled: false, hour: 18, minute: 0 },
  mass: { enabled: false, weekday: 1, hour: 9, minute: 0 },
};

const COPY: Record<ReminderKind, { title: string; body: string }> = {
  rosary: {
    title: 'Time for the Rosary',
    body: 'Pause for a few minutes and pray today’s mysteries with the community.',
  },
  mass: {
    title: 'Sunday Mass',
    body: 'Join the celebration of the Mass — in your parish or on All Catholic Media.',
  },
};

export async function loadReminderPrefs(): Promise<ReminderPrefs> {
  if (Platform.OS === 'web') return DEFAULT_PREFS;
  try {
    const raw = await SecureStore.getItemAsync(PREF_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ReminderPrefs>;
    return {
      rosary: { ...DEFAULT_PREFS.rosary, ...parsed.rosary },
      mass: { ...DEFAULT_PREFS.mass, ...parsed.mass },
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

async function savePrefs(prefs: ReminderPrefs): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await SecureStore.setItemAsync(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

/** Cancel every reminder we previously scheduled (leaves other notifications alone). */
async function clearOurs(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.tag === TAG)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Persist `prefs` and rebuild the OS schedule to match. Requests notification
 * permission if any reminder is being enabled. Returns the prefs actually
 * stored (reminders are forced off if permission is denied).
 */
export async function applyReminderPrefs(prefs: ReminderPrefs): Promise<ReminderPrefs> {
  if (Platform.OS === 'web') return prefs;

  const wantsAny = prefs.rosary.enabled || prefs.mass.enabled;
  if (wantsAny && !(await ensureNotificationPermission())) {
    const off: ReminderPrefs = {
      rosary: { ...prefs.rosary, enabled: false },
      mass: { ...prefs.mass, enabled: false },
    };
    await savePrefs(off);
    await clearOurs();
    return off;
  }

  await savePrefs(prefs);
  await clearOurs();

  if (prefs.rosary.enabled) {
    await Notifications.scheduleNotificationAsync({
      content: { ...COPY.rosary, data: { tag: TAG, kind: 'rosary' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.rosary.hour,
        minute: prefs.rosary.minute,
      },
    });
  }

  if (prefs.mass.enabled) {
    await Notifications.scheduleNotificationAsync({
      content: { ...COPY.mass, data: { tag: TAG, kind: 'mass' } },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: prefs.mass.weekday,
        hour: prefs.mass.hour,
        minute: prefs.mass.minute,
      },
    });
  }

  return prefs;
}

export function formatTime(hour: number, minute: number): string {
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
}
