import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Field, FormError } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, type PrayerVisibility } from '@/lib/app-content';
import { useAuth } from '@/lib/auth-store';
import { useFormErrors, validators } from '@/lib/form-errors';

const VISIBILITY: { key: PrayerVisibility; label: string; blurb: string }[] = [
  {
    key: 'prayer_team',
    label: 'The prayer team',
    blurb: "Fr. Morson's prayer team prays for this. It is never shown publicly.",
  },
  {
    key: 'only_me',
    label: 'Only me',
    blurb: 'Kept private to your account as a personal intention. No one else sees it.',
  },
  {
    key: 'community',
    label: 'The community prayer wall',
    blurb: 'Your intention appears on the prayer wall so others can pray with you. Your name and contact details are never shown.',
  },
];

const FIELD_MAP = { full_name: 'full_name', email: 'email', phone: 'phone', intention: 'intention' };

export default function PrayerRequestScreen() {
  const router = useRouter();
  const theme = useTheme();
  const qc = useQueryClient();
  const member = useAuth((s) => s.member);
  const { fieldErrors, formError, setField, clear, fromError } = useFormErrors(FIELD_MAP);

  const [intention, setIntention] = useState('');
  const [visibility, setVisibility] = useState<PrayerVisibility>('prayer_team');
  const [name, setName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [location, setLocation] = useState('');
  const [followUp, setFollowUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    clear();
    const checks = {
      intention: validators.required(intention, 'Your intention'),
      full_name: validators.required(name, 'Name'),
      email: validators.required(email, 'Email') ?? validators.email(email),
    };
    if (Object.values(checks).some(Boolean)) {
      Object.entries(checks).forEach(([k, v]) => setField(k, v));
      return;
    }

    setSubmitting(true);
    try {
      await appContentApi.submitPrayerRequest({
        full_name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        intention: intention.trim(),
        visibility,
        allow_follow_up: followUp,
      });
      qc.invalidateQueries({ queryKey: ['account', 'prayer-requests'] });
      setDone(true);
    } catch (e) {
      fromError(e, 'Could not send your prayer request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <FormScreen
        title="Your prayer is with us"
        subtitle="Thank you. Our prayer team will lift up your intention with care.">
        <ThemedText themeColor="gold" style={styles.doneCross}>
          ✝
        </ThemedText>
        <Button label="DONE" onPress={() => router.back()} />
        {member ? (
          <Button
            label="VIEW MY PRAYER REQUESTS"
            variant="ghost"
            onPress={() => router.replace('/my-prayers')}
          />
        ) : null}
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Your prayer matters"
      subtitle="Share what you would like us to pray for, and choose who may pray with you.">
      <FormError message={formError} />

      <Field
        label="Your intention"
        value={intention}
        onChangeText={setIntention}
        error={fieldErrors.intention}
        placeholder="Share what you would like us to pray for."
        multiline
        numberOfLines={5}
        maxLength={5000}
        style={styles.textArea}
      />

      <View style={styles.group}>
        <ThemedText type="smallBold" style={styles.groupLabel}>
          Who may pray with you?
        </ThemedText>
        {VISIBILITY.filter((o) => o.key !== 'only_me' || member).map((option) => {
          const active = visibility === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() => setVisibility(option.key)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              style={[
                styles.choice,
                { borderColor: active ? theme.gold : theme.border, backgroundColor: theme.backgroundElement },
              ]}>
              <View style={[styles.radio, { borderColor: active ? theme.gold : theme.border }]}>
                {active ? <View style={[styles.radioDot, { backgroundColor: theme.gold }]} /> : null}
              </View>
              <View style={styles.choiceCopy}>
                <ThemedText style={styles.choiceLabel}>{option.label}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.choiceBlurb}>
                  {option.blurb}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Field
        label="Your name"
        value={name}
        onChangeText={setName}
        error={fieldErrors.full_name}
        autoCapitalize="words"
      />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={fieldErrors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        hint="So the prayer team can reach you if you ask them to."
      />
      <Field
        label="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        error={fieldErrors.phone}
        keyboardType="phone-pad"
      />
      <Field label="Location (optional)" value={location} onChangeText={setLocation} />

      <Pressable
        onPress={() => setFollowUp((v) => !v)}
        style={styles.consent}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: followUp }}>
        <View
          style={[
            styles.checkbox,
            { borderColor: followUp ? theme.gold : theme.border },
            followUp && { backgroundColor: theme.gold },
          ]}>
          {followUp ? <ThemedText style={styles.checkGlyph}>✓</ThemedText> : null}
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.consentText}>
          The prayer team may follow up with me about this intention.
        </ThemedText>
      </Pressable>

      <View style={[styles.urgent, { borderColor: theme.danger }]}>
        <ThemedText type="small" style={{ color: theme.danger }}>
          This app is not an emergency service. If you or someone else is in danger or crisis,
          contact your local emergency number or a crisis line right away.
        </ThemedText>
      </View>

      <Button label="SEND PRAYER REQUEST" onPress={submit} loading={submitting} />
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  textArea: { minHeight: 120, textAlignVertical: 'top', paddingTop: Spacing.two },
  group: { gap: Spacing.two },
  groupLabel: { fontSize: 12.5, letterSpacing: 0.4, opacity: 0.9 },
  choice: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.three - 2,
    alignItems: 'flex-start',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  choiceCopy: { flex: 1, minWidth: 0, gap: 2 },
  choiceLabel: { fontSize: 14, fontWeight: '600', color: '#f3f6fa' },
  choiceBlurb: { lineHeight: 18 },
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
  urgent: { borderWidth: 1, borderRadius: 10, padding: Spacing.three - 2 },
  doneCross: { fontSize: 40, textAlign: 'center', marginVertical: Spacing.three },
});
