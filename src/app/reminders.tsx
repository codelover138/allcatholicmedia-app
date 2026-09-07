import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { FormNotice } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  applyReminderPrefs,
  DEFAULT_PREFS,
  formatTime,
  loadReminderPrefs,
  remindersSupported,
  type ReminderPrefs,
} from '@/lib/reminders';

const ROSARY_TIMES = [6, 8, 12, 15, 18, 21];
const MASS_TIMES = [7, 8, 9, 10, 11];

export default function RemindersScreen() {
  const theme = useTheme();
  const [prefs, setPrefs] = useState<ReminderPrefs | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadReminderPrefs().then((p) => {
      if (alive) setPrefs(p);
    });
    return () => {
      alive = false;
    };
  }, []);

  const commit = async (next: ReminderPrefs) => {
    setPrefs(next); // optimistic
    setNotice(null);
    const applied = await applyReminderPrefs(next);
    setPrefs(applied);
    if ((next.rosary.enabled || next.mass.enabled) && !applied.rosary.enabled && !applied.mass.enabled) {
      setNotice(
        remindersSupported
          ? 'Notifications are turned off for All Catholic Media. Enable them in your device settings to get reminders.'
          : 'Reminders need the full app (a development build) — they don’t run in Expo Go.',
      );
    }
  };

  if (!prefs) {
    return (
      <FormScreen title="Prayer reminders" subtitle="Gentle nudges to pause and pray. Nothing is shared.">
        <LoadingState />
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Prayer reminders"
      subtitle="Gentle nudges to pause and pray. These stay on this device — nothing is shared.">
      <FormNotice message={notice} tone="info" />

      {/* Daily Rosary */}
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.cardHead}>
          <View style={styles.cardCopy}>
            <ThemedText style={styles.cardTitle}>Daily Rosary</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {prefs.rosary.enabled
                ? `Every day at ${formatTime(prefs.rosary.hour, prefs.rosary.minute)}`
                : 'A daily reminder to pray the Rosary'}
            </ThemedText>
          </View>
          <Switch
            value={prefs.rosary.enabled}
            onValueChange={(enabled) => commit({ ...prefs, rosary: { ...prefs.rosary, enabled } })}
            trackColor={{ true: theme.gold, false: theme.border }}
            thumbColor="#f3f6fa"
          />
        </View>
        {prefs.rosary.enabled ? (
          <View style={styles.times}>
            {ROSARY_TIMES.map((h) => {
              const active = prefs.rosary.hour === h && prefs.rosary.minute === 0;
              return (
                <ThemedText
                  key={h}
                  onPress={() => commit({ ...prefs, rosary: { ...prefs.rosary, hour: h, minute: 0 } })}
                  style={[
                    styles.timeChip,
                    { borderColor: active ? theme.gold : theme.border, color: theme.text },
                    active && { backgroundColor: theme.gold, color: '#0d1f3c' },
                  ]}>
                  {formatTime(h, 0)}
                </ThemedText>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* Sunday Mass */}
      <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View style={styles.cardHead}>
          <View style={styles.cardCopy}>
            <ThemedText style={styles.cardTitle}>Sunday Mass</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {prefs.mass.enabled
                ? `Sundays at ${formatTime(prefs.mass.hour, prefs.mass.minute)}`
                : 'A weekly reminder for Sunday Mass'}
            </ThemedText>
          </View>
          <Switch
            value={prefs.mass.enabled}
            onValueChange={(enabled) => commit({ ...prefs, mass: { ...prefs.mass, enabled } })}
            trackColor={{ true: theme.gold, false: theme.border }}
            thumbColor="#f3f6fa"
          />
        </View>
        {prefs.mass.enabled ? (
          <View style={styles.times}>
            {MASS_TIMES.map((h) => {
              const active = prefs.mass.hour === h && prefs.mass.minute === 0;
              return (
                <ThemedText
                  key={h}
                  onPress={() => commit({ ...prefs, mass: { ...prefs.mass, hour: h, minute: 0, weekday: 1 } })}
                  style={[
                    styles.timeChip,
                    { borderColor: active ? theme.gold : theme.border, color: theme.text },
                    active && { backgroundColor: theme.gold, color: '#0d1f3c' },
                  ]}>
                  {formatTime(h, 0)}
                </ThemedText>
              );
            })}
          </View>
        ) : null}
      </View>

      <ThemedText
        type="small"
        themeColor="textSecondary"
        onPress={() => commit(DEFAULT_PREFS)}
        style={styles.reset}>
        Reset reminders
      </ThemedText>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, gap: Spacing.three },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  cardCopy: { flex: 1, minWidth: 0, gap: 2 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#f3f6fa' },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  timeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two - 1,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
  },
  reset: { alignSelf: 'flex-start', textDecorationLine: 'underline' },
});
