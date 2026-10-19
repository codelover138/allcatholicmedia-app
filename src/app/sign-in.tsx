import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, View } from 'react-native';

import { Button, Field, FormError, PasswordField } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { GoogleSignInButton } from '@/components/google-button';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api-client';
import { authApi, isTokenPayload } from '@/lib/auth-api';
import { useAuth } from '@/lib/auth-store';
import {
  authenticateWithBiometrics,
  biometricAvailable,
  biometricKind,
  biometricLabel,
  getBiometricCredentials,
  saveBiometricCredentials,
  type BiometricCredentials,
  type BiometricKind,
} from '@/lib/biometrics';
import { deviceName } from '@/lib/device';
import { useFormErrors, validators } from '@/lib/form-errors';

export default function SignInScreen() {
  const router = useRouter();
  const theme = useTheme();
  const signIn = useAuth((s) => s.signIn);
  const { fieldErrors, formError, setField, setFormError, clear, fromError } = useFormErrors();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Biometric & Face ID state ──
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioKind, setBioKind] = useState<BiometricKind>('face');
  const [bioName, setBioName] = useState('Face ID');
  const [savedBio, setSavedBio] = useState<BiometricCredentials | null>(null);
  const [bioLoading, setBioLoading] = useState(false);
  const [enableBioAfterLogin, setEnableBioAfterLogin] = useState(true);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const [avail, kind, name, creds] = await Promise.all([
        biometricAvailable(),
        biometricKind(),
        biometricLabel(),
        getBiometricCredentials(),
      ]);
      if (!alive) return;
      setBioAvailable(avail);
      setBioKind(kind);
      setBioName(name);
      setSavedBio(creds);
      if (creds?.email) {
        setEmail(creds.email);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const handleBiometricLogin = async () => {
    if (!bioAvailable) {
      Alert.alert(
        `${bioName} unavailable`,
        `Please set up ${bioName} in your device settings to use biometric login.`
      );
      return;
    }

    if (!savedBio) {
      Alert.alert(
        `Enable ${bioName} first`,
        `Sign in once with your email and password, keeping "Enable ${bioName}" turned on. You can then sign in with one tap next time!`
      );
      return;
    }

    setBioLoading(true);
    try {
      const creds = await authenticateWithBiometrics(`Sign in to All Catholic Media with ${bioName}`);
      if (!creds) {
        setBioLoading(false);
        return;
      }

      await signIn(creds.token, creds.member);
      router.replace('/profile');
    } catch {
      setFormError(`Could not verify with ${bioName}. Please sign in with your password.`);
    } finally {
      setBioLoading(false);
    }
  };

  const submit = async () => {
    clear();
    const emailErr = validators.required(email, 'Email') ?? validators.email(email);
    const passErr = validators.required(password, 'Password');
    if (emailErr || passErr) {
      setField('email', emailErr);
      setField('password', passErr);
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.login({
        email: email.trim(),
        password,
        device_name: deviceName(),
      });

      if (isTokenPayload(res.data)) {
        if (bioAvailable && enableBioAfterLogin) {
          await saveBiometricCredentials({
            token: res.data.token,
            member: res.data.member,
            email: email.trim(),
          });
        }

        await signIn(res.data.token, res.data.member);
        router.replace('/profile');
      }
    } catch (err) {
      if (err instanceof ApiError && err.code === 'email_not_verified') {
        router.push({ pathname: '/verify-email', params: { email: email.trim() } });
        return;
      }
      fromError(err, 'Could not sign you in. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const bioIcon =
    bioKind === 'face'
      ? 'scan-outline'
      : bioKind === 'fingerprint'
        ? 'finger-print-outline'
        : 'shield-checkmark-outline';

  return (
    <FormScreen
      title="Welcome back to your faith community"
      subtitle="Sign in to comment, save content, submit prayer requests, and give."
      footer={
        <View style={styles.footerRow}>
          <ThemedText type="small" themeColor="textSecondary">
            New here?
          </ThemedText>
          <Pressable onPress={() => router.replace('/register')} hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.gold }}>
              Join the All Catholic Media family
            </ThemedText>
          </Pressable>
        </View>
      }>
      <FormError message={formError} />

      {/* ── Prominent Biometric / Face ID Login Card ── */}
      {bioAvailable && savedBio ? (
        <View style={[styles.bioCard, { backgroundColor: theme.backgroundElement, borderColor: theme.gold }]}>
          <View style={styles.bioCardHeader}>
            <View style={[styles.bioIconWrap, { backgroundColor: theme.goldSoft, borderColor: theme.gold }]}>
              <Ionicons name={bioIcon} size={28} color={theme.gold} />
            </View>
            <View style={styles.bioTextGroup}>
              <View style={styles.badgeRow}>
                <Ionicons name="sparkles" size={12} color={theme.gold} />
                <ThemedText type="badge" themeColor="gold">
                  SAVED BIOMETRIC LOGIN
                </ThemedText>
              </View>
              <ThemedText type="subtitle" style={styles.bioMemberName} numberOfLines={1}>
                {savedBio.member?.first_name || savedBio.member?.name || 'Faith Member'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {savedBio.email}
              </ThemedText>
            </View>
          </View>

          <Pressable
            onPress={handleBiometricLogin}
            disabled={bioLoading}
            style={({ pressed }) => [
              styles.bioLoginButton,
              { backgroundColor: theme.gold },
              pressed && { backgroundColor: theme.goldPressed },
              bioLoading && { opacity: 0.7 },
            ]}>
            {bioLoading ? (
              <ActivityIndicator color="#0d1f3c" size="small" />
            ) : (
              <>
                <Ionicons name={bioIcon} size={20} color="#0d1f3c" />
                <ThemedText type="smallBold" style={styles.bioBtnText}>
                  SIGN IN WITH {bioName.toUpperCase()}
                </ThemedText>
              </>
            )}
          </Pressable>

          <View style={styles.orDividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
            <ThemedText type="badge" themeColor="textSecondary" style={styles.orText}>
              OR WITH PASSWORD
            </ThemedText>
            <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
          </View>
        </View>
      ) : null}

      {/* ── Standard Email & Password Form ── */}
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoCorrect={false}
        returnKeyType="next"
        placeholder="you@example.com"
      />

      <PasswordField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
        placeholder="Your password"
      />

      <View style={styles.passwordRow}>
        <Pressable
          onPress={() => router.push({ pathname: '/forgot-password', params: { email: email.trim() } })}
          hitSlop={8}
          style={styles.forgot}>
          <ThemedText type="small" style={{ color: theme.blue }}>
            Forgot your password?
          </ThemedText>
        </Pressable>

        {/* Device Biometrics Toggle */}
        {bioAvailable ? (
          <View style={styles.bioToggleWrap}>
            <Ionicons name={bioIcon} size={15} color={theme.gold} />
            <ThemedText type="small" themeColor="textSecondary" style={{ marginRight: Spacing.one }}>
              Enable {bioName}
            </ThemedText>
            <Switch
              value={enableBioAfterLogin}
              onValueChange={setEnableBioAfterLogin}
              trackColor={{ true: theme.gold, false: theme.border }}
              thumbColor="#f3f6fa"
              style={styles.smallSwitch}
            />
          </View>
        ) : null}
      </View>

      <Button label="SIGN IN WITH EMAIL" onPress={submit} loading={submitting} />

      {/* If device has biometrics but not enrolled yet, show secondary Face ID prompt button */}
      {bioAvailable && !savedBio ? (
        <Pressable
          onPress={handleBiometricLogin}
          style={({ pressed }) => [
            styles.biometricSecondaryBtn,
            { borderColor: theme.gold, backgroundColor: theme.backgroundElement },
            pressed && { backgroundColor: theme.goldSoft },
          ]}>
          <Ionicons name={bioIcon} size={18} color={theme.gold} />
          <ThemedText type="smallBold" themeColor="gold">
            SIGN IN WITH {bioName.toUpperCase()}
          </ThemedText>
        </Pressable>
      ) : null}

      <GoogleSignInButton onError={(m) => setFormError(m || null)} />

      <Button label="CONTINUE AS GUEST" variant="ghost" onPress={() => router.replace('/')} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-start' },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: -Spacing.one,
  },
  bioToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  bioCard: {
    borderRadius: Radius.large,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: Spacing.three,
    marginBottom: Spacing.two,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  bioCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  bioIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioTextGroup: {
    flex: 1,
    gap: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bioMemberName: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '700',
  },
  bioLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 48,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.four,
  },
  bioBtnText: {
    color: '#0d1f3c',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  biometricSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    minHeight: 46,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.four,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  orText: {
    fontSize: 10,
    letterSpacing: 0.8,
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
});

