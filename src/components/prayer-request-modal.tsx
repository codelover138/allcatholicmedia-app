import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, type PrayerRequestInput } from '@/lib/app-content';

type PrayerRequestModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PrayerRequestModal({ visible, onClose }: PrayerRequestModalProps) {
  const theme = useTheme();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [intention, setIntention] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const submitMutation = useMutation({
    mutationFn: (input: PrayerRequestInput) => appContentApi.submitPrayerRequest(input),
    onSuccess: () => {
      setSubmitted(true);
      setErrorMessage('');
    },
    onError: (err: Error) => {
      setErrorMessage(err.message || 'Failed to submit prayer request. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!fullName.trim() || !email.trim() || !intention.trim()) {
      setErrorMessage('Please fill in your name, email, and prayer intention.');
      return;
    }
    setErrorMessage('');
    submitMutation.mutate({
      full_name: fullName.trim(),
      email: email.trim(),
      intention: intention.trim(),
      is_private: isPrivate,
    });
  };

  const handleReset = () => {
    setFullName('');
    setEmail('');
    setIntention('');
    setIsPrivate(false);
    setSubmitted(false);
    setErrorMessage('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <ThemedView variant="elevated" style={styles.modalContent}>
          {/* Top Bar */}
          <View style={styles.headerRow}>
            <View style={styles.titleGroup}>
              <View style={[styles.headerIconWrap, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="hand-left" size={20} color={theme.accent} />
              </View>
              <View>
                <ThemedText type="subtitle" style={styles.modalTitle}>
                  Prayer Request
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Fr. Morsin Livingston & Ministry
                </ThemedText>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}>
              <Ionicons name="close" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} contentContainerStyle={styles.scrollInner}>
            {submitted ? (
              <View style={styles.successContainer}>
                <View style={[styles.successIconBadge, { backgroundColor: theme.goldSoft }]}>
                  <Ionicons name="checkmark-circle" size={48} color={theme.gold} />
                </View>
                <ThemedText type="title" style={{ textAlign: 'center' }}>
                  Prayer Submitted
                </ThemedText>
                <ThemedText type="default" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                  Your prayer intention has been received. Our ministry and prayer group will lift your intention in prayer.
                </ThemedText>

                <Pressable
                  onPress={handleReset}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: theme.accent },
                    pressed && { opacity: 0.85 },
                  ]}>
                  <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                    Done
                  </ThemedText>
                </Pressable>
              </View>
            ) : (
              <>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                  Submit your prayer intentions to our ministry intercession team. All intentions are treated with reverence.
                </ThemedText>

                {errorMessage ? (
                  <View style={[styles.errorBanner, { backgroundColor: theme.accentLight }]}>
                    <Ionicons name="alert-circle-outline" size={16} color={theme.accent} />
                    <ThemedText type="smallBold" style={{ color: theme.accent, flex: 1 }}>
                      {errorMessage}
                    </ThemedText>
                  </View>
                ) : null}

                {/* Form Fields */}
                <View style={styles.fieldGroup}>
                  <ThemedText type="smallBold" themeColor="text">
                    Your Full Name *
                  </ThemedText>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="e.g. Maria Santos"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.input,
                      { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText type="smallBold" themeColor="text">
                    Email Address *
                  </ThemedText>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="e.g. maria@example.com"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[
                      styles.input,
                      { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <ThemedText type="smallBold" themeColor="text">
                    Prayer Intention *
                  </ThemedText>
                  <TextInput
                    value={intention}
                    onChangeText={setIntention}
                    placeholder="Share your prayer intentions, health needs, or Thanksgiving..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={4}
                    style={[
                      styles.textArea,
                      { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
                    ]}
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <ThemedText type="smallBold" themeColor="text">
                      Keep Intention Private
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Only shared with Fr. Morsin & ministry prayer leaders
                    </ThemedText>
                  </View>
                  <Switch
                    value={isPrivate}
                    onValueChange={setIsPrivate}
                    trackColor={{ false: theme.border, true: theme.accentSoft }}
                    thumbColor={isPrivate ? theme.accent : '#ffffff'}
                  />
                </View>

                <Pressable
                  onPress={handleSubmit}
                  disabled={submitMutation.isPending}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    { backgroundColor: theme.accent },
                    (pressed || submitMutation.isPending) && { opacity: 0.8 },
                  ]}>
                  {submitMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="send" size={16} color="#ffffff" />
                      <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                        Submit Intention
                      </ThemedText>
                    </>
                  )}
                </Pressable>
              </>
            )}
          </ScrollView>
        </ThemedView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    maxHeight: '90%',
    borderTopLeftRadius: Radius.xlarge,
    borderTopRightRadius: Radius.xlarge,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    lineHeight: 22,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  scrollBody: {
    maxHeight: 520,
  },
  scrollInner: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  input: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: 1,
    fontSize: 15,
  },
  textArea: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: 1,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    borderRadius: Radius.full,
    marginTop: Spacing.two,
  },
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.five,
    gap: Spacing.three,
  },
  successIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
