import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/form';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-store';

const ANGELUS = [
  'V. The Angel of the Lord declared unto Mary.',
  'R. And she conceived of the Holy Spirit. — Hail Mary…',
  'V. Behold the handmaid of the Lord.',
  'R. Be it done unto me according to thy word. — Hail Mary…',
  'V. And the Word was made flesh.',
  'R. And dwelt among us. — Hail Mary…',
  'V. Pray for us, O holy Mother of God.',
  'R. That we may be made worthy of the promises of Christ.',
];

export default function PrayScreen() {
  const theme = useTheme();
  const router = useRouter();
  const status = useAuth((s) => s.status);
  const [showAngelus, setShowAngelus] = useState(false);

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <AppHeader />
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.inner}>
            <ThemedText style={styles.title}>Pray</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              A place to bring your heart before God, alone or with the community.
            </ThemedText>

            {/* Prayer request */}
            <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText themeColor="gold" style={styles.cardCross}>
                ✝
              </ThemedText>
              <ThemedText style={styles.cardTitle}>Submit a prayer request</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.cardBody}>
                Your prayer matters. Share an intention with the prayer team, or with the community
                prayer wall — you choose who may pray with you.
              </ThemedText>
              <Button label="SHARE AN INTENTION" onPress={() => router.push('/prayer-request')} />
              {status === 'authed' ? (
                <Pressable onPress={() => router.push('/my-prayers')} hitSlop={8} style={styles.link}>
                  <ThemedText type="small" themeColor="blue">
                    View my prayer requests
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>

            {/* Daily prayer */}
            <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText type="smallBold" style={styles.kicker}>
                DAILY PRAYER
              </ThemedText>
              <ThemedText style={styles.cardTitle}>The Angelus</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.cardBody}>
                A moment to pause and remember the Incarnation — prayed morning, noon, and evening.
              </ThemedText>
              {showAngelus ? (
                <View style={[styles.prayerText, { borderLeftColor: theme.gold }]}>
                  {ANGELUS.map((line) => (
                    <ThemedText key={line} type="small" style={styles.prayerLine}>
                      {line}
                    </ThemedText>
                  ))}
                </View>
              ) : null}
              <Button
                label={showAngelus ? 'CLOSE' : 'PRAY NOW'}
                variant={showAngelus ? 'ghost' : 'primary'}
                onPress={() => setShowAngelus((v) => !v)}
              />
            </View>

            {/* Reminders */}
            <Pressable
              onPress={() => router.push('/reminders')}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <ThemedText themeColor="gold" style={styles.rowGlyph}>
                🔔
              </ThemedText>
              <View style={styles.rowCopy}>
                <ThemedText style={styles.rowTitle}>Prayer reminders</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Gentle daily Rosary and Sunday Mass nudges
                </ThemedText>
              </View>
              <ThemedText themeColor="textSecondary" style={styles.rowChevron}>
                ›
              </ThemedText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.five,
    alignItems: 'center',
  },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  title: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 32,
    color: '#f3f6fa',
  },
  card: { borderWidth: 1, borderRadius: 14, padding: Spacing.three, gap: Spacing.two + 2 },
  cardCross: { fontSize: 22 },
  kicker: { fontSize: 11, letterSpacing: 0.7, opacity: 0.8 },
  cardTitle: { fontFamily: Fonts.serif, fontWeight: '700', fontSize: 18, color: '#f3f6fa' },
  cardBody: { lineHeight: 19 },
  link: { alignSelf: 'flex-start' },
  prayerText: { borderLeftWidth: 2, paddingLeft: Spacing.three, gap: Spacing.one + 2 },
  prayerLine: { lineHeight: 20, color: '#e7ecf3' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three - 2,
  },
  rowGlyph: { fontSize: 18, width: 24, textAlign: 'center' },
  rowCopy: { flex: 1, minWidth: 0, gap: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#f3f6fa' },
  rowChevron: { fontSize: 20 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
