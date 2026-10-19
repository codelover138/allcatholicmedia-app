import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button, FormError, FormNotice, PasswordField } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { accountApi, authApi, type AuthSession } from '@/lib/auth-api';
import { useAuth } from '@/lib/auth-store';
import {
  biometricAvailable,
  biometricKind,
  biometricLabel,
  clearBiometricCredentials,
  hasBiometricCredentials,
  promptBiometric,
  saveBiometricCredentials,
} from '@/lib/biometrics';
import { formatShortDate } from '@/lib/format';
import { useFormErrors, validators } from '@/lib/form-errors';

export default function AccountSecurityScreen() {
  const router = useRouter();
  const theme = useTheme();
  const qc = useQueryClient();
  const signOut = useAuth((s) => s.signOut);
  const token = useAuth((s) => s.token);
  const member = useAuth((s) => s.member);

  // ── App lock & Face ID (biometric) ──
  const biometricEnabled = useAuth((s) => s.biometricEnabled);
  const setBiometricEnabled = useAuth((s) => s.setBiometricEnabled);
  const [bioSupported, setBioSupported] = useState(false);
  const [bioName, setBioName] = useState('Face ID');
  const [bioKind, setBioKind] = useState<'face' | 'fingerprint' | 'iris' | 'biometric'>('face');
  const [hasCreds, setHasCreds] = useState(false);
  const [bioBusy, setBioBusy] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [ok, name, kind, credsExist] = await Promise.all([
        biometricAvailable(),
        biometricLabel(),
        biometricKind(),
        hasBiometricCredentials(),
      ]);
      if (!alive) return;
      setBioSupported(ok);
      setBioName(name);
      setBioKind(kind);
      setHasCreds(credsExist);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const toggleAppLock = async (nextValue: boolean) => {
    if (bioBusy) return;
    setBioBusy(true);
    try {
      if (nextValue) {
        if (!bioSupported) {
          Alert.alert(
            `No ${bioName} set up`,
            `Add ${bioName} in your device settings first.`
          );
          return;
        }
        const ok = await promptBiometric(`Confirm to turn on ${bioName} app lock`);
        if (!ok) return;

        // Also save biometric credentials if not already saved
        if (token && member) {
          await saveBiometricCredentials({
            token,
            member,
            email: member.email,
          });
          setHasCreds(true);
        }
      }
      await setBiometricEnabled(nextValue);
    } finally {
      setBioBusy(false);
    }
  };

  const toggleQuickSignIn = async (nextValue: boolean) => {
    if (bioBusy) return;
    setBioBusy(true);
    try {
      if (nextValue) {
        if (!bioSupported) {
          Alert.alert(`No ${bioName} set up`, `Configure ${bioName} in your device settings first.`);
          return;
        }
        const ok = await promptBiometric(`Verify ${bioName} to enable one-tap sign-in`);
        if (!ok) return;

        if (token && member) {
          await saveBiometricCredentials({
            token,
            member,
            email: member.email,
          });
          setHasCreds(true);
          Alert.alert('Enabled!', `${bioName} sign-in is now active on this device.`);
        }
      } else {
        await clearBiometricCredentials();
        setHasCreds(false);
        Alert.alert('Removed', `${bioName} credentials removed from this device.`);
      }
    } finally {
      setBioBusy(false);
    }
  };

  const testBiometrics = async () => {
    setTestSuccess(false);
    const ok = await promptBiometric(`Test ${bioName} verification`);
    if (ok) {
      setTestSuccess(true);
      Alert.alert('Verification Successful', `${bioName} is functioning properly and ready for secure access.`);
    } else {
      Alert.alert('Verification Cancelled / Failed', `Could not verify ${bioName}. Try again.`);
    }
  };

  // ── Change password ──
  const pw = useFormErrors();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [logoutOthers, setLogoutOthers] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const changePassword = async () => {
    pw.clear();
    setPwSaved(false);
    const checks = {
      current_password: validators.required(current, 'Current password'),
      password: validators.required(next, 'New password') ?? validators.min(next, 8, 'New password'),
      confirm: validators.match(next, confirm),
    };
    if (Object.values(checks).some(Boolean)) {
      Object.entries(checks).forEach(([k, v]) => pw.setField(k, v));
      return;
    }
    setSavingPw(true);
    try {
      await authApi.changePassword({
        current_password: current,
        password: next,
        password_confirmation: confirm,
        logout_other_devices: logoutOthers,
      });
      setPwSaved(true);
      setCurrent('');
      setNext('');
      setConfirm('');
      qc.invalidateQueries({ queryKey: ['account', 'sessions'] });
    } catch (e) {
      pw.fromError(e, 'Could not update your password.');
    } finally {
      setSavingPw(false);
    }
  };

  // ── Sessions ──
  const sessionsQ = useQuery({
    queryKey: ['account', 'sessions'],
    queryFn: accountApi.sessions,
  });

  const revoke = (s: AuthSession) => {
    Alert.alert('Sign out this device?', `${s.name} will need to sign in again.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await accountApi.revokeSession(s.id);
          sessionsQ.refetch();
        },
      },
    ]);
  };

  // ── Delete account ──
  const [deleting, setDeleting] = useState(false);
  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This permanently removes your profile, saved items, prayer requests, and giving history. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await accountApi.destroy();
              await signOut({ revokeOnServer: false });
              router.replace('/');
            } catch {
              setDeleting(false);
              Alert.alert('Could not delete your account', 'Please try again in a moment.');
            }
          },
        },
      ],
    );
  };

  return (
    <FormScreen title="Account & security" subtitle="Manage your password and where you're signed in.">
      {/* Change password */}
      <View style={styles.section}>
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          CHANGE PASSWORD
        </ThemedText>
        <FormError message={pw.formError} />
        <FormNotice message={pwSaved ? 'Password updated.' : null} />
        <PasswordField
          label="Current password"
          value={current}
          onChangeText={setCurrent}
          error={pw.fieldErrors.current_password}
          textContentType="password"
        />
        <PasswordField
          label="New password"
          value={next}
          onChangeText={setNext}
          error={pw.fieldErrors.password}
          textContentType="newPassword"
          hint="At least 8 characters."
        />
        <PasswordField
          label="Confirm new password"
          value={confirm}
          onChangeText={setConfirm}
          error={pw.fieldErrors.confirm}
          textContentType="newPassword"
        />
        <Pressable
          onPress={() => setLogoutOthers((v) => !v)}
          style={styles.toggleRow}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: logoutOthers }}>
          <View
            style={[
              styles.checkbox,
              { borderColor: logoutOthers ? theme.gold : theme.border },
              logoutOthers && { backgroundColor: theme.gold },
            ]}>
            {logoutOthers ? <ThemedText style={styles.checkGlyph}>✓</ThemedText> : null}
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.toggleText}>
            Sign out of all other devices
          </ThemedText>
        </Pressable>
        <Button label="UPDATE PASSWORD" onPress={changePassword} loading={savingPw} />
      </View>

      {/* Biometric Security & Face Login */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons
            name={bioKind === 'face' ? 'scan-outline' : 'finger-print-outline'}
            size={16}
            color={theme.gold}
          />
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            BIOMETRIC SECURITY & FACE LOGIN
          </ThemedText>
        </View>

        {testSuccess ? (
          <View style={[styles.testSuccessBanner, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.gold} />
            <ThemedText type="smallBold" themeColor="gold">
              {bioName} verified successfully! Your device is ready.
            </ThemedText>
          </View>
        ) : null}

        {/* 1. App Lock Switch */}
        <View style={[styles.bioSettingCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.sessionCopy}>
            <View style={styles.bioTitleRow}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.gold} />
              <ThemedText style={styles.sessionName}>
                Require {bioName} to open app
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {bioSupported
                ? 'Secures your private prayers and content whenever the app returns from background.'
                : `Set up ${bioName} in your device settings first to enable app protection.`}
            </ThemedText>
          </View>
          <Switch
            value={biometricEnabled}
            onValueChange={toggleAppLock}
            disabled={bioBusy || (!bioSupported && !biometricEnabled)}
            trackColor={{ true: theme.gold, false: theme.border }}
            thumbColor="#f3f6fa"
          />
        </View>

        {/* 2. One-Tap Biometric Sign-In Switch */}
        <View style={[styles.bioSettingCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.sessionCopy}>
            <View style={styles.bioTitleRow}>
              <Ionicons
                name={bioKind === 'face' ? 'scan-outline' : 'finger-print-outline'}
                size={18}
                color={theme.gold}
              />
              <ThemedText style={styles.sessionName}>
                One-tap {bioName} sign-in
              </ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {hasCreds
                ? `Active on this device for ${member?.email || 'your account'}. You can sign in with one tap.`
                : `Save your session securely to sign in with ${bioName} next time without entering your password.`}
            </ThemedText>
          </View>
          <Switch
            value={hasCreds}
            onValueChange={toggleQuickSignIn}
            disabled={bioBusy || !bioSupported}
            trackColor={{ true: theme.gold, false: theme.border }}
            thumbColor="#f3f6fa"
          />
        </View>

        {/* 3. Test Biometric Verification Button */}
        {bioSupported ? (
          <Pressable
            onPress={testBiometrics}
            style={({ pressed }) => [
              styles.testBioBtn,
              { borderColor: theme.gold, backgroundColor: theme.backgroundElement },
              pressed && { backgroundColor: theme.goldSoft },
            ]}>
            <Ionicons
              name={bioKind === 'face' ? 'scan-outline' : 'finger-print-outline'}
              size={18}
              color={theme.gold}
            />
            <ThemedText type="smallBold" themeColor="gold">
              TEST {bioName.toUpperCase()} VERIFICATION
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {/* Sessions */}
      <View style={styles.section}>
        <ThemedText type="smallBold" style={styles.sectionTitle}>
          ACTIVE SESSIONS
        </ThemedText>
        {sessionsQ.data?.data.sessions.map((s) => (
          <View
            key={s.id}
            style={[styles.sessionRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.sessionCopy}>
              <ThemedText style={styles.sessionName}>
                {s.name}
                {s.current ? '  (this device)' : ''}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {s.last_used_at ? `Last active ${formatShortDate(s.last_used_at)}` : 'Not used yet'}
              </ThemedText>
            </View>
            {!s.current ? (
              <Pressable onPress={() => revoke(s)} hitSlop={8}>
                <ThemedText type="smallBold" style={{ color: theme.danger }}>
                  Revoke
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

      {/* Danger zone */}
      <View style={[styles.section, styles.dangerZone, { borderColor: theme.danger }]}>
        <ThemedText type="smallBold" style={[styles.sectionTitle, { color: theme.danger }]}>
          DELETE ACCOUNT
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Permanently delete your account and all associated data.
        </ThemedText>
        <Button label="DELETE MY ACCOUNT" variant="danger" onPress={confirmDelete} loading={deleting} />
      </View>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.three },
  sectionTitle: { fontSize: 11, letterSpacing: 0.7, opacity: 0.85 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkGlyph: { color: '#0d1f3c', fontSize: 13, fontWeight: '900' },
  toggleText: { flex: 1 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.three - 2,
  },
  sessionCopy: { flex: 1, minWidth: 0, gap: 1 },
  sessionName: { fontSize: 14, fontWeight: '600', color: '#f3f6fa' },
  dangerZone: { borderWidth: 1, borderRadius: 12, padding: Spacing.three },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.oneHalf,
  },
  testSuccessBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two + 2,
    borderRadius: Radius.medium,
    borderWidth: 1,
  },
  bioSettingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.large,
    padding: Spacing.three,
  },
  bioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.oneHalf,
    marginBottom: 2,
  },
  testBioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two + 2,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    marginTop: Spacing.half,
  },
});
