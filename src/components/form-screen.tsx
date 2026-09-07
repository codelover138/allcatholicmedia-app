import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Shared shell for the auth + profile forms: the basilica backdrop, a back
 * control, a serif page title with optional subtitle, and a keyboard-aware
 * scroll area. Matches the reverent, editorial tone of the content screens.
 */
export function FormScreen({
  title,
  subtitle,
  children,
  footer,
  onBack,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
}) {
  const theme = useTheme();
  const router = useRouter();

  const back = () => {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
    else router.replace('/profile');
  };

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable onPress={back} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <ThemedText style={styles.backGlyph}>‹ Back</ThemedText>
          </Pressable>
          <View style={styles.wordmark}>
            <ThemedText themeColor="gold" style={styles.cross}>
              ✝
            </ThemedText>
            <ThemedText type="smallBold" style={styles.wordmarkText}>
              All Catholic Media
            </ThemedText>
          </View>
        </View>

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive">
            <View style={styles.inner}>
              <View style={styles.head}>
                <ThemedText style={styles.title}>{title}</ThemedText>
                {subtitle ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                    {subtitle}
                  </ThemedText>
                ) : null}
              </View>

              <View style={styles.body}>{children}</View>

              {footer ? <View style={[styles.footer, { borderTopColor: theme.border }]}>{footer}</View> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  backGlyph: { fontSize: 15, fontWeight: '600', color: '#f3f6fa' },
  wordmark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cross: { fontSize: 15 },
  wordmarkText: { fontFamily: Fonts.serif, fontSize: 13, color: '#f3f6fa' },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    alignItems: 'center',
  },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.four },
  head: { gap: Spacing.two },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 34,
    color: '#f3f6fa',
  },
  subtitle: { fontSize: 14, lineHeight: 20 },
  body: { gap: Spacing.three },
  footer: { borderTopWidth: 1, paddingTop: Spacing.three, gap: Spacing.two },
});
