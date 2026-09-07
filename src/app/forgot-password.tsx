import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { Button, Field, FormError, FormNotice } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { authApi } from '@/lib/auth-api';
import { useFormErrors, validators } from '@/lib/form-errors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const { fieldErrors, formError, setField, clear, fromError } = useFormErrors();

  const [email, setEmail] = useState(params.email ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async () => {
    clear();
    setSent(null);
    const err = validators.required(email, 'Email') ?? validators.email(email);
    if (err) {
      setField('email', err);
      return;
    }
    setSubmitting(true);
    try {
      const res = await authApi.forgotPassword(email.trim());
      setSent(res.data.message ?? 'If that email is registered, a reset link is on its way.');
    } catch (e) {
      fromError(e, 'Could not send the reset link. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send a link to choose a new password.">
      <FormError message={formError} />
      <FormNotice message={sent} tone="info" />

      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        editable={!sent}
        placeholder="you@example.com"
        onSubmitEditing={submit}
        returnKeyType="send"
      />

      {sent ? (
        <Button label="BACK TO SIGN IN" onPress={() => router.replace('/sign-in')} />
      ) : (
        <Button label="SEND RESET LINK" onPress={submit} loading={submitting} />
      )}
    </FormScreen>
  );
}
