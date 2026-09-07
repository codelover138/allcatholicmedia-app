import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';

import { Button, FormError, FormNotice } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { authApi } from '@/lib/auth-api';
import { useFormErrors } from '@/lib/form-errors';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { formError, clear, fromError } = useFormErrors();

  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const resend = async () => {
    if (!email) return;
    clear();
    setSent(null);
    setSubmitting(true);
    try {
      const res = await authApi.resendVerification(email);
      setSent(res.data.message ?? 'A new verification link has been sent.');
    } catch (e) {
      fromError(e, 'Could not resend the verification email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen
      title="Confirm your email"
      subtitle={
        email
          ? `We sent a verification link to ${email}. Tap it to finish setting up your account, then sign in.`
          : 'We sent you a verification link. Tap it to finish setting up your account, then sign in.'
      }>
      <FormError message={formError} />
      <FormNotice message={sent} tone="info" />

      <ThemedText type="small" themeColor="textSecondary">
        The link can take a minute to arrive. Check your spam folder if it has not shown up.
      </ThemedText>

      {email ? (
        <Button
          label="RESEND VERIFICATION EMAIL"
          variant="secondary"
          onPress={resend}
          loading={submitting}
        />
      ) : null}

      <Button label="BACK TO SIGN IN" onPress={() => router.replace('/sign-in')} />
    </FormScreen>
  );
}
