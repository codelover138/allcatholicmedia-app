import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Field, FormError, PasswordField } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authApi, isTokenPayload } from '@/lib/auth-api';
import { useAuth } from '@/lib/auth-store';
import { deviceName } from '@/lib/device';
import { useFormErrors, validators } from '@/lib/form-errors';

// Map server field names onto the form's field keys.
const FIELD_MAP = {
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  phone: 'phone',
  password: 'password',
};

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const signIn = useAuth((s) => s.signIn);
  const { fieldErrors, formError, setField, clear, fromError } = useFormErrors(FIELD_MAP);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    clear();
    const checks: Record<string, string | undefined> = {
      first_name: validators.required(firstName, 'First name'),
      last_name: validators.required(lastName, 'Last name'),
      email: validators.required(email, 'Email') ?? validators.email(email),
      password: validators.required(password, 'Password') ?? validators.min(password, 8, 'Password'),
      confirm: validators.match(password, confirm),
    };
    if (Object.values(checks).some(Boolean)) {
      Object.entries(checks).forEach(([k, v]) => setField(k, v));
      return;
    }
    if (!agreed) {
      setField('agreed', 'Please accept the community guidelines and privacy policy.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authApi.register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
        password_confirmation: confirm,
        device_name: deviceName(),
      });

      if (isTokenPayload(res.data)) {
        await signIn(res.data.token, res.data.member);
        router.replace('/profile');
      } else {
        router.replace({ pathname: '/verify-email', params: { email: email.trim() } });
      }
    } catch (err) {
      fromError(err, 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen
      title="Join the All Catholic Media family"
      subtitle="One faith. One family. One place. Create an account to save content, join the conversation, and pray with the community."
      footer={
        <View style={styles.footerRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Already a member?
          </ThemedText>
          <Pressable onPress={() => router.replace('/sign-in')} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="blue">
              Sign in
            </ThemedText>
          </Pressable>
        </View>
      }>
      <FormError message={formError} />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Field
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            error={fieldErrors.first_name}
            autoCapitalize="words"
            textContentType="givenName"
            placeholder="Mary"
          />
        </View>
        <View style={styles.rowItem}>
          <Field
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            error={fieldErrors.last_name}
            autoCapitalize="words"
            textContentType="familyName"
            placeholder="Ward"
          />
        </View>
      </View>

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
        placeholder="you@example.com"
      />

      <Field
        label="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        error={fieldErrors.phone}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        placeholder="For prayer-team follow-up only"
      />

      <PasswordField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={fieldErrors.password}
        textContentType="newPassword"
        hint="At least 8 characters."
        placeholder="Create a password"
      />

      <PasswordField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        error={fieldErrors.confirm}
        textContentType="newPassword"
        placeholder="Re-enter your password"
        onSubmitEditing={submit}
        returnKeyType="go"
      />

      <Pressable
        onPress={() => setAgreed((v) => !v)}
        style={styles.consent}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}>
        <View
          style={[
            styles.checkbox,
            { borderColor: fieldErrors.agreed ? theme.danger : agreed ? theme.gold : theme.border },
            agreed && { backgroundColor: theme.gold },
          ]}>
          {agreed ? <ThemedText style={styles.checkGlyph}>✓</ThemedText> : null}
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.consentText}>
          I accept the community guidelines and privacy policy.
        </ThemedText>
      </Pressable>
      {fieldErrors.agreed ? (
        <ThemedText type="small" style={{ color: theme.danger, marginTop: -Spacing.two }}>
          {fieldErrors.agreed}
        </ThemedText>
      ) : null}

      <Button label="CREATE ACCOUNT" onPress={submit} loading={submitting} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.three },
  rowItem: { flex: 1 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  consent: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkGlyph: { color: '#0d1f3c', fontSize: 13, fontWeight: '900' },
  consentText: { flex: 1, lineHeight: 19 },
});
