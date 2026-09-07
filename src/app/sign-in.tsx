import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Field, FormError, PasswordField } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api-client';
import { authApi, isTokenPayload } from '@/lib/auth-api';
import { useAuth } from '@/lib/auth-store';
import { deviceName } from '@/lib/device';
import { useFormErrors, validators } from '@/lib/form-errors';

export default function SignInScreen() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const { fieldErrors, formError, setField, clear, fromError } = useFormErrors();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
            <ThemedText type="smallBold" themeColor="blue">
              Join the All Catholic Media family
            </ThemedText>
          </Pressable>
        </View>
      }>
      <FormError message={formError} />

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

      <Pressable
        onPress={() => router.push({ pathname: '/forgot-password', params: { email: email.trim() } })}
        hitSlop={8}
        style={styles.forgot}>
        <ThemedText type="small" themeColor="blue">
          Forgot your password?
        </ThemedText>
      </Pressable>

      <Button label="SIGN IN" onPress={submit} loading={submitting} />

      <Button label="CONTINUE AS GUEST" variant="ghost" onPress={() => router.replace('/')} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  forgot: { alignSelf: 'flex-start', marginTop: -Spacing.one },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
});
