import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/form';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-store';
import { biometricKind, biometricLabel, promptBiometric, type BiometricKind } from '@/lib/biometrics';

/**
 * Full-screen biometric gate. Mounted once at the app root, above the tabs. When
 * the member has enabled app lock, it covers the app on cold start and whenever
 * the app returns from the background until Face ID / Touch ID / fingerprint
 * succeeds.
 */
export function LockGate() {
  const router = useRouter();
  const theme = useTheme();
  const status = useAuth((s) => s.status);
  const locked = useAuth((s) => s.locked);
  const biometricEnabled = useAuth((s) => s.biometricEnabled);
  const member = useAuth((s) => s.member);
  const lock = useAuth((s) => s.lock);
  const unlock = useAuth((s) => s.unlock);
  const signOut = useAuth((s) => s.signOut);

  const [attempting, setAttempting] = useState(false);
  const [failed, setFailed] = useState(false);
  const [kind, setKind] = useState<BiometricKind>('face');
  const [label, setLabel] = useState('Face ID');

  const active = status === 'authed' && biometricEnabled && locked;

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [k, l] = await Promise.all([biometricKind(), biometricLabel()]);
      if (!alive) return;
      setKind(k);
      setLabel(l);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Re-lock when the app is sent to the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') lock();
    });
    return () => sub.remove();
  }, [lock]);

  const tryUnlock = useCallback(async () => {
    setAttempting(true);
    setFailed(false);
    const ok = await promptBiometric(`Verify your identity with ${label}`);
    setAttempting(false);
    if (ok) unlock();
    else setFailed(true);
  }, [label, unlock]);

  // Auto-prompt once each time the gate becomes active.
  const promptedFor = useRef(false);
  useEffect(() => {
    if (active && !promptedFor.current) {
      promptedFor.current = true;
      void tryUnlock();
    }
    if (!active) promptedFor.current = false;
  }, [active, tryUnlock]);

  if (!active) return null;

  const iconName =
    kind === 'face'
      ? 'scan-outline'
      : kind === 'fingerprint'
        ? 'finger-print-outline'
        : 'shield-checkmark-outline';

  const memberName = member?.first_name || member?.name || 'Faith Member';

  return (
    <View style={StyleSheet.absoluteFill}>
      <ScreenBackground>
        <View style={styles.center}>
          {/* Sacred Cross */}
          <ThemedText themeColor="gold" style={styles.cross}>
            ✝
          </ThemedText>

          {/* Biometric Scanner Medallion */}
          <Pressable onPress={tryUnlock} style={styles.scannerWrapper}>
            <View style={[styles.scannerRingOuter, { borderColor: theme.goldSoft }]} />
            <View style={[styles.scannerCircle, { backgroundColor: theme.backgroundElement, borderColor: theme.gold }]}>
              <Ionicons name={iconName} size={48} color={failed ? theme.danger : theme.gold} />
            </View>
          </Pressable>

          <ThemedText style={styles.title}>All Catholic Media</ThemedText>

          <View style={[styles.badgePill, { backgroundColor: theme.goldSoft }]}>
            <Ionicons name="lock-closed" size={12} color={theme.gold} />
            <ThemedText type="badge" themeColor="gold">
              SECURE FAITH SANCTUARY
            </ThemedText>
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            {failed
              ? `${label} verification failed. Tap below to try again.`
              : `Welcome back, ${memberName}. Verify with ${label} to resume your prayer session.`}
          </ThemedText>

          <View style={styles.actions}>
            <Button
              label={attempting ? 'VERIFYING…' : `UNLOCK WITH ${label.toUpperCase()}`}
              onPress={tryUnlock}
              loading={attempting}
            />

            <Pressable
              onPress={() => signOut().then(() => router.replace('/'))}
              hitSlop={10}
              style={styles.signOut}>
              <ThemedText type="small" style={{ color: theme.blue }}>
                Sign out or use password
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </ScreenBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    gap: Spacing.two,
  },
  cross: { fontSize: 32, marginBottom: Spacing.one },
  scannerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.two,
  },
  scannerRingOuter: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
    opacity: 0.6,
  },
  scannerCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 24,
    color: '#f3f6fa',
    letterSpacing: -0.3,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: 2,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 19,
    marginTop: Spacing.one,
  },
  actions: { alignSelf: 'stretch', gap: Spacing.three, marginTop: Spacing.four },
  signOut: { alignSelf: 'center', paddingVertical: Spacing.one },
});

