import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Field, FormError, FormNotice } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api-client';
import { appContentApi } from '@/lib/app-content';
import { useAuth } from '@/lib/auth-store';
import { useFormErrors, validators } from '@/lib/form-errors';

export default function ContactScreen() {
  const router = useRouter();
  const theme = useTheme();
  const member = useAuth((s) => s.member);
  const { fieldErrors, formError, setField, clear, fromError } = useFormErrors();

  const [name, setName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async () => {
    clear();
    setSent(null);
    const checks: Record<string, string | undefined> = {
      name: validators.required(name, 'Name'),
      email: validators.required(email, 'Email') ?? validators.email(email),
      content: validators.required(message, 'Message'),
    };
    if (Object.values(checks).some(Boolean)) {
      Object.entries(checks).forEach(([k, v]) => setField(k, v));
      return;
    }
    if (!agreed) {
      setField('agree_terms_and_policy', 'Please accept the terms and privacy policy.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await appContentApi.submitContact({
        name: name.trim(),
        email: email.trim(),
        content: message.trim(),
        subject: subject.trim() || undefined,
        agree_terms_and_policy: true,
      });
      setSent(res.data.message ?? 'Thanks — we’ll be in touch soon.');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        fromError(e, 'Contact isn’t available right now. Please try again later.');
      } else {
        fromError(e, 'Could not send your message. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen
      title="Get in touch"
      subtitle="Questions, corrections, or feedback for the All Catholic Media team.">
      <FormError message={formError} />
      <FormNotice message={sent} tone="success" />

      <Field
        label="Name"
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
      />

      <Field
        label="Subject (optional)"
        value={subject}
        onChangeText={setSubject}
        error={fieldErrors.subject}
        placeholder="What's this about?"
        editable={!sent}
      />

      <Field
        label="Message"
        value={message}
        onChangeText={setMessage}
        error={fieldErrors.content}
        placeholder="How can we help?"
        multiline
        numberOfLines={5}
        editable={!sent}
      />

      {!sent ? (
        <>
          <Pressable
            onPress={() => setAgreed((v) => !v)}
            style={styles.consent}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}>
            <View
              style={[
                styles.checkbox,
                { borderColor: fieldErrors.agree_terms_and_policy ? theme.danger : agreed ? theme.gold : theme.border },
                agreed && { backgroundColor: theme.gold },
              ]}>
              {agreed ? <ThemedText style={styles.checkGlyph}>✓</ThemedText> : null}
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.consentText}>
              I accept the terms and privacy policy.
            </ThemedText>
          </Pressable>
          {fieldErrors.agree_terms_and_policy ? (
            <ThemedText type="small" style={{ color: theme.danger, marginTop: -Spacing.two }}>
              {fieldErrors.agree_terms_and_policy}
            </ThemedText>
          ) : null}

          <Button label="SEND MESSAGE" onPress={submit} loading={submitting} />
        </>
      ) : (
        <Button label="DONE" onPress={() => router.back()} />
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
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
