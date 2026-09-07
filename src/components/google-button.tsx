import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { googleAuthConfigured, signInWithGoogle } from '@/lib/google-auth';

/**
 * "Continue with Google" — renders nothing until the app is configured with a
 * Google client id (EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) and the backend Social
 * Login plugin has Google enabled. On success it lands on the profile.
 */
export function GoogleSignInButton({ onError }: { onError: (message: string) => void }) {
  const theme = useTheme();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!googleAuthConfigured) return null;

  const go = async () => {
    onError('');
    setBusy(true);
    const res = await signInWithGoogle();
    setBusy(false);
    if (res.ok) {
      router.replace('/profile');
      return;
    }
    if (!res.cancelled) onError(res.message);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.or}>
          or
        </ThemedText>
        <View style={[styles.line, { backgroundColor: theme.border }]} />
      </View>
      <Button label="CONTINUE WITH GOOGLE" variant="secondary" onPress={go} loading={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  or: { textTransform: 'uppercase', letterSpacing: 1 },
});
