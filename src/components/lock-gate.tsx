import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/form';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { promptBiometric } from '@/lib/biometrics';
import { useAuth } from '@/lib/auth-store';

/**
 * Full-screen biometric gate. Mounted once at the app root, above the tabs. When
 * the member has enabled app lock, it covers the app on cold start and whenever
 * the app returns from the background until Face ID / Touch ID / fingerprint
 * succeeds.
 */
export function LockGate() {
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const locked = useAuth((s) => s.locked);
  const biometricEnabled = useAuth((s) => s.biometricEnabled);
  const lock = useAuth((s) => s.lock);
  const unlock = useAuth((s) => s.unlock);
  const signOut = useAuth((s) => s.signOut);

  const [attempting, setAttempting] = useState(false);
  const [failed, setFailed] = useState(false);
  const active = status === 'authed' && biometricEnabled && locked;

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
    const ok = await promptBiometric('Unlock All Catholic Media');
    setAttempting(false);
    if (ok) unlock();
    else setFailed(true);
  }, [unlock]);

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

  return (
    <View style={StyleSheet.absoluteFill}>
      <ScreenBackground>
        <View style={styles.center}>
          <ThemedText themeColor="gold" style={styles.cross}>
            ✝
          </ThemedText>
          <ThemedText style={styles.title}>All Catholic Media</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
            {failed
              ? 'Unlock failed. Try again to continue.'
              : 'Locked. Verify it’s you to continue.'}
          </ThemedText>

          <View style={styles.actions}>
            <Button
              label={attempting ? 'VERIFYING…' : 'UNLOCK'}
              onPress={tryUnlock}
              loading={attempting}
            />
            <Pressable
              onPress={() => signOut().then(() => router.replace('/'))}
              hitSlop={10}
              style={styles.signOut}>
              <ThemedText type="small" themeColor="blue">
                Sign out instead
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
  cross: { fontSize: 34, marginBottom: Spacing.two },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 22,
    color: '#f3f6fa',
  },
  subtitle: { textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: Spacing.three, marginTop: Spacing.four },
  signOut: { alignSelf: 'center' },
});
