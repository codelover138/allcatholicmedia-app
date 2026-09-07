import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Field, FormError, FormNotice } from '@/components/form';
import { FormScreen } from '@/components/form-screen';
import { LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi } from '@/lib/app-content';
import { useAuth } from '@/lib/auth-store';

type Outcome = 'completed' | 'cancelled' | 'pending' | 'error';

export default function DonateScreen() {
  const theme = useTheme();
  const qc = useQueryClient();
  const member = useAuth((s) => s.member);

  const configQ = useQuery({ queryKey: ['app', 'donate-config'], queryFn: appContentApi.donateConfig });
  const config = configQ.data?.data;

  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const currencySymbol = config?.currency === 'USD' ? '$' : `${config?.currency ?? ''} `;

  // Fully-native flow (members only): our API creates the PayPal order, we open
  // just the approval page and catch PayPal's redirect back to the app.
  const nativeCheckout = async (value: number): Promise<Outcome> => {
    const returnUrl = Linking.createURL('donate-return');
    const res = await appContentApi.createDonationCheckout({
      amount: value,
      message: config?.supports_prayer_message && message.trim() ? message.trim() : undefined,
      return_url: returnUrl,
    });

    const result = await WebBrowser.openAuthSessionAsync(res.data.approval_url, returnUrl);
    if (result.type !== 'success' || !result.url) return 'pending';
    const status = Linking.parse(result.url).queryParams?.status;
    return status === 'completed' || status === 'cancelled' || status === 'error' ? status : 'pending';
  };

  // Fallback: the hosted web donation page (collects name/email itself). Used for
  // guests and whenever the native endpoint isn't available.
  const hostedCheckout = async (value: number): Promise<Outcome> => {
    if (!config) return 'error';
    const url = new URL(config.guest_checkout_url);
    url.searchParams.set('amount', value.toFixed(2));
    if (config.supports_prayer_message && message.trim()) url.searchParams.set('message', message.trim());
    if (member?.email) url.searchParams.set('donor_email', member.email);
    if (member?.name) url.searchParams.set('donor_name', member.name);

    await WebBrowser.openBrowserAsync(url.toString(), {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      toolbarColor: '#0d1f3c',
      controlsColor: '#c9a227',
    });
    return 'pending'; // the hosted page owns the result; we can't read it
  };

  const openCheckout = async () => {
    if (!config) return;
    setError(null);
    setOutcome(null);
    const value = Number(amount);
    if (!amount.trim() || Number.isNaN(value) || value <= 0) {
      setError('Enter an amount to give.');
      return;
    }
    if (value < config.minimum_amount || value > config.maximum_amount) {
      setError(
        `Choose an amount between ${currencySymbol}${config.minimum_amount} and ${currencySymbol}${config.maximum_amount}.`,
      );
      return;
    }

    setOpening(true);
    try {
      let result: Outcome;
      if (member) {
        try {
          result = await nativeCheckout(value);
        } catch {
          result = await hostedCheckout(value); // endpoint not deployed / PayPal error
        }
      } else {
        result = await hostedCheckout(value);
      }
      setOutcome(result);
      if (result === 'completed' || result === 'pending') {
        qc.invalidateQueries({ queryKey: ['account', 'donations'] });
      }
    } finally {
      setOpening(false);
    }
  };

  const outcomeNotice =
    outcome === 'completed'
      ? 'Thank you — your gift is received. It will appear in your giving history shortly.'
      : outcome === 'pending'
        ? 'If you completed your gift, it will appear in your giving history shortly.'
        : outcome === 'cancelled'
          ? 'No charge was made. You can try again whenever you are ready.'
          : null;
  const outcomeError = outcome === 'error' ? 'Something went wrong with the payment. You have not been charged.' : null;

  return (
    <FormScreen
      title="Support the mission"
      subtitle="Your gift keeps Fr. Morson's ministry free and reaching more of the family — one faith, one family, one place.">
      {configQ.isLoading ? (
        <LoadingState />
      ) : configQ.isError || !config ? (
        <FormError message="Could not load giving options. Please try again later." />
      ) : (
        <>
          <FormError message={error ?? outcomeError} />
          <FormNotice message={outcomeNotice} tone={outcome === 'completed' ? 'success' : 'info'} />

          <View style={styles.group}>
            <ThemedText type="smallBold" style={styles.groupLabel}>
              Choose an amount
            </ThemedText>
            <View style={styles.presets}>
              {config.preset_amounts.map((preset) => {
                const active = amount === String(preset);
                return (
                  <ThemedText
                    key={preset}
                    onPress={() => {
                      setAmount(String(preset));
                      setError(null);
                    }}
                    style={[
                      styles.preset,
                      { borderColor: active ? theme.gold : theme.border, color: theme.text },
                      active && { backgroundColor: theme.gold, color: '#0d1f3c' },
                    ]}>
                    {currencySymbol}
                    {preset}
                  </ThemedText>
                );
              })}
            </View>
          </View>

          <Field
            label="Or enter an amount"
            value={amount}
            onChangeText={(t) => {
              setAmount(t.replace(/[^0-9.]/g, ''));
              setError(null);
            }}
            keyboardType="decimal-pad"
            placeholder={`${currencySymbol}0.00`}
            inputMode="decimal"
          />

          {config.supports_prayer_message ? (
            <Field
              label="Add a prayer or note (optional)"
              value={message}
              onChangeText={setMessage}
              placeholder="Share an intention with the ministry."
              multiline
              numberOfLines={3}
              maxLength={500}
              style={styles.textArea}
            />
          ) : null}

          <Button
            label="CONTINUE TO SECURE CHECKOUT"
            onPress={openCheckout}
            loading={opening}
          />

          <View style={[styles.trust, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.trustText}>
              🔒 Payments are processed securely by PayPal on the All Catholic Media website. Your card
              details never pass through the app. One-time and recurring options are shown at checkout,
              and every gift appears in your giving history.
            </ThemedText>
          </View>
        </>
      )}
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  groupLabel: { fontSize: 12.5, letterSpacing: 0.4, opacity: 0.9 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  preset: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: Spacing.two },
  trust: { borderWidth: 1, borderRadius: 10, padding: Spacing.three - 2 },
  trustText: { lineHeight: 19 },
});
