import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button, Field, FormError, FormNotice } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { accountApi } from '@/lib/auth-api';
import { useAuth } from '@/lib/auth-store';
import { useFormErrors, validators } from '@/lib/form-errors';
import { pickAvatar } from '@/lib/image-pick';

const GENDERS = ['female', 'male', 'other', 'prefer not to say'];

export default function AccountEditScreen() {
  const router = useRouter();
  const theme = useTheme();
  const member = useAuth((s) => s.member);
  const setMember = useAuth((s) => s.setMember);
  const { fieldErrors, formError, setField, clear, fromError } = useFormErrors();

  const profileQ = useQuery({ queryKey: ['account', 'profile'], queryFn: accountApi.show });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarUri = member?.avatar_thumb ?? member?.avatar ?? undefined;
  const avatarInitials =
    [member?.first_name?.[0], member?.last_name?.[0]].filter(Boolean).join('').toUpperCase() ||
    (member?.name?.[0]?.toUpperCase() ?? '✝');

  const changeAvatar = async () => {
    clear();
    const picked = await pickAvatar();
    if (!picked) return;
    setUploadingAvatar(true);
    try {
      const res = await accountApi.updateAvatar(picked);
      setMember(res.data.member);
    } catch (e) {
      fromError(e, 'Could not update your photo. Please try a different image.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  // Seed the form from the server profile once it arrives (and again if a
  // different member is loaded). Done during render, per React's "adjust state
  // when a prop changes" guidance, rather than in an effect.
  const [seededFor, setSeededFor] = useState<number | null>(null);
  const loaded = profileQ.data?.data.member;
  if (loaded && loaded.id !== seededFor) {
    setSeededFor(loaded.id);
    setFirstName(loaded.first_name ?? '');
    setLastName(loaded.last_name ?? '');
    setPhone(loaded.phone ?? '');
    setDob((loaded.dob ?? '').slice(0, 10));
    setGender(loaded.gender ?? '');
    setBio(loaded.description ?? '');
  }

  const submit = async () => {
    clear();
    setSaved(false);
    const checks = {
      first_name: validators.required(firstName, 'First name'),
      last_name: validators.required(lastName, 'Last name'),
      dob: dob && !/^\d{4}-\d{2}-\d{2}$/.test(dob.trim()) ? 'Use the format YYYY-MM-DD.' : undefined,
    };
    if (Object.values(checks).some(Boolean)) {
      Object.entries(checks).forEach(([k, v]) => setField(k, v));
      return;
    }

    setSubmitting(true);
    try {
      const res = await accountApi.update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
        dob: dob.trim() || null,
        gender: gender.trim() || null,
        description: bio.trim() || null,
      });
      setMember(res.data.member);
      setSaved(true);
      setTimeout(() => router.back(), 600);
    } catch (e) {
      fromError(e, 'Could not save your changes. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreen title="Edit profile" subtitle="This is how you appear to the All Catholic Media community.">
      {profileQ.isLoading ? (
        <LoadingState />
      ) : (
        <>
          <FormError message={formError} />
          <FormNotice message={saved ? 'Profile saved.' : null} />

          <View style={styles.avatarBlock}>
            <View style={[styles.avatar, { borderColor: theme.gold, backgroundColor: theme.backgroundSelected }]}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <ThemedText themeColor="gold" style={styles.avatarInitials}>
                  {avatarInitials}
                </ThemedText>
              )}
              {uploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#f3f6fa" />
                </View>
              ) : null}
            </View>
            <Pressable onPress={changeAvatar} disabled={uploadingAvatar} hitSlop={8}>
              <ThemedText type="smallBold" themeColor="blue">
                {uploadingAvatar ? 'Uploading…' : 'Change photo'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <Field
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                error={fieldErrors.first_name}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.rowItem}>
              <Field
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                error={fieldErrors.last_name}
                autoCapitalize="words"
              />
            </View>
          </View>

          <Field
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            error={fieldErrors.phone}
            keyboardType="phone-pad"
            hint="Shared only with the prayer team for follow-up."
          />

          <Field
            label="Date of birth (optional)"
            value={dob}
            onChangeText={setDob}
            error={fieldErrors.dob}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />

          <View style={styles.fieldGroup}>
            <ThemedText type="smallBold" style={styles.groupLabel}>
              Gender (optional)
            </ThemedText>
            <View style={styles.chips}>
              {GENDERS.map((g) => {
                const active = gender.toLowerCase() === g;
                return (
                  <ThemedText
                    key={g}
                    onPress={() => setGender(active ? '' : g)}
                    style={[
                      styles.chip,
                      { borderColor: active ? theme.gold : theme.border, color: theme.text },
                      active && { backgroundColor: theme.gold, color: '#0d1f3c' },
                    ]}>
                    {g[0].toUpperCase() + g.slice(1)}
                  </ThemedText>
                );
              })}
            </View>
          </View>

          <Field
            label="About you (optional)"
            value={bio}
            onChangeText={setBio}
            error={fieldErrors.description}
            placeholder="A short line about your faith journey."
            multiline
            numberOfLines={4}
            maxLength={2000}
            style={styles.textArea}
          />

          <Button label="SAVE CHANGES" onPress={submit} loading={submitting} />
        </>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  avatarBlock: { alignItems: 'center', gap: Spacing.two },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 26, fontWeight: '800' },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(6,14,29,0.55)',
  },
  row: { flexDirection: 'row', gap: Spacing.three },
  rowItem: { flex: 1 },
  fieldGroup: { gap: Spacing.two },
  groupLabel: { fontSize: 12.5, letterSpacing: 0.4, opacity: 0.9 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two,
    fontSize: 13,
    fontWeight: '600',
    overflow: 'hidden',
  },
  textArea: { minHeight: 96, textAlignVertical: 'top', paddingTop: Spacing.two },
});
