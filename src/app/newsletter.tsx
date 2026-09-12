import { useState } from 'react';
import { useRouter } from 'expo-router';

import { Button, Field, FormError, FormNotice } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { ApiError } from '@/lib/api-client';
import { appContentApi } from '@/lib/app-content';
import { useAuth } from '@/lib/auth-store';
import { useFormErrors, validators } from '@/lib/form-errors';

export default function NewsletterScreen() {
  const router = useRouter();
  const member = useAuth((s) => s.member);
  const { fieldErrors, formError, setField, clear, fromError } = useFormErrors();

  const [name, setName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
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
      const res = await appContentApi.subscribeNewsletter(email.trim(), name.trim() || undefined);
      setSent(res.data.message ?? 'You are subscribed.');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        fromError(e, 'Newsletter sign-up isn’t available right now. Please try again later.');
      } else {
        fromError(e, 'Could not subscribe. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen
      title="Sunday reflections, in your inbox"
      subtitle="A free weekly note from All Catholic Media — no spam, unsubscribe anytime.">
      <FormError message={formError} />
      <FormNotice message={sent} tone="success" />

      <Field
        label="Name (optional)"
        value={name}
        onChangeText={setName}
        error={fieldErrors.name}
        autoCapitalize="words"
        placeholder="Mary Ward"
        editable={!sent}
      />

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
        editable={!sent}
        onSubmitEditing={submit}
        returnKeyType="send"
      />

      {sent ? (
        <Button label="DONE" onPress={() => router.back()} />
      ) : (
        <Button label="SUBSCRIBE" onPress={submit} loading={submitting} />
      )}
    </FormScreen>
  );
}
