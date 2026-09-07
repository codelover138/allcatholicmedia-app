import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/app-header';
import { Button } from '@/components/form';
import { LoadingState } from '@/components/query-state';
import { ScreenBackground } from '@/components/screen-background';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { accountApi } from '@/lib/auth-api';
import { useAuth } from '@/lib/auth-store';

export default function ProfileScreen() {
  const status = useAuth((s) => s.status);

  return (
    <ScreenBackground>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <AppHeader />
        {status === 'loading' ? (
          <LoadingState />
        ) : status === 'authed' ? (
          <Dashboard />
        ) : (
          <GuestState />
        )}
      </SafeAreaView>
    </ScreenBackground>
  );
}

// ── Signed-in dashboard ────────────────────────────────────────────────
function Dashboard() {
  const theme = useTheme();
  const router = useRouter();
  const member = useAuth((s) => s.member);
  const signOut = useAuth((s) => s.signOut);

  const savedQ = useQuery({
    queryKey: ['account', 'bookmarks', 'count'],
    queryFn: () => accountApi.bookmarks({ page: 1 }),
  });
  const prayersQ = useQuery({
    queryKey: ['account', 'prayer-requests', 'count'],
    queryFn: () => accountApi.prayerRequests(1),
  });
  const givingQ = useQuery({
    queryKey: ['account', 'donations', 'count'],
    queryFn: () => accountApi.donations(1),
  });
  const activityQ = useQuery({
    queryKey: ['account', 'activities', 'recent'],
    queryFn: () => accountApi.activities(1),
  });

  const refetchAll = () => {
    savedQ.refetch();
    prayersQ.refetch();
    givingQ.refetch();
    activityQ.refetch();
  };

  const initials = [member?.first_name?.[0], member?.last_name?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || (member?.name?.[0]?.toUpperCase() ?? '✝');

  const confirmSignOut = () => {
    Alert.alert('Sign out', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut().then(() => router.replace('/')) },
    ]);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={
        <RefreshControl
          refreshing={savedQ.isRefetching || prayersQ.isRefetching || givingQ.isRefetching}
          onRefresh={refetchAll}
          tintColor={theme.textSecondary}
        />
      }>
      <View style={styles.inner}>
        <ThemedText style={styles.pageTitle}>Your account</ThemedText>

        {/* Identity card */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.identityRow}>
            <View style={[styles.avatar, { borderColor: theme.gold, backgroundColor: theme.backgroundSelected }]}>
              {member?.avatar_thumb || member?.avatar ? (
                <Image
                  source={{ uri: member.avatar_thumb ?? member.avatar ?? undefined }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <ThemedText themeColor="gold" style={styles.avatarInitials}>
                  {initials}
                </ThemedText>
              )}
            </View>
            <View style={styles.identityText}>
              <ThemedText style={styles.name} numberOfLines={1}>
                {member?.name || `${member?.first_name ?? ''} ${member?.last_name ?? ''}`.trim() || 'Member'}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {member?.email}
              </ThemedText>
              <View style={styles.badges}>
                {member?.email_verified ? (
                  <Badge label="✓ Verified" color={theme.success} />
                ) : (
                  <Pressable
                    onPress={() =>
                      router.push({ pathname: '/verify-email', params: { email: member?.email ?? '' } })
                    }>
                    <Badge label="Verify email" color={theme.gold} />
                  </Pressable>
                )}
              </View>
            </View>
          </View>
          <Button label="EDIT PROFILE" variant="secondary" onPress={() => router.push('/account-edit')} />
        </View>

        {/* Quick stats */}
        <View style={styles.statsRow}>
          <StatTile
            label="Saved"
            value={savedQ.data?.meta.pagination.total}
            onPress={() => router.push('/saved')}
          />
          <StatTile
            label="Prayers"
            value={prayersQ.data?.meta.pagination.total}
            onPress={() => router.push('/my-prayers')}
          />
          <StatTile
            label="Gifts"
            value={givingQ.data?.meta.pagination.total}
            onPress={() => router.push('/giving')}
          />
        </View>

        {/* Menu */}
        <View style={[styles.card, styles.menu, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <MenuRow glyph="★" label="Saved items" hint="Reflections, videos, and prayers" onPress={() => router.push('/saved')} />
          <MenuRow glyph="✝" label="My prayer requests" hint="Intentions you've submitted" onPress={() => router.push('/my-prayers')} />
          <MenuRow glyph="♥" label="Giving history" hint="Receipts and recurring gifts" onPress={() => router.push('/giving')} />
          <MenuRow glyph="🔔" label="Prayer reminders" hint="Daily Rosary and Sunday Mass" onPress={() => router.push('/reminders')} />
          <MenuRow glyph="⚙" label="Account & security" hint="Password, sessions, delete account" onPress={() => router.push('/account-security')} last />
        </View>

        {/* Recent activity */}
        {activityQ.data?.data.length ? (
          <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              RECENT ACTIVITY
            </ThemedText>
            <View style={styles.activityList}>
              {activityQ.data.data.slice(0, 4).map((a) => (
                <View key={a.id} style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: theme.gold }]} />
                  <ThemedText type="small" style={styles.activityText} numberOfLines={2}>
                    {a.description || a.action}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Button label="SUPPORT THE MISSION" onPress={() => router.push('/donate')} />
        <Button label="SIGN OUT" variant="ghost" onPress={confirmSignOut} />
      </View>
    </ScrollView>
  );
}

// ── Signed-out invitation ──────────────────────────────────────────────
function GuestState() {
  const theme = useTheme();
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.inner}>
        <ThemedText style={styles.pageTitle}>Profile</ThemedText>

        <View style={[styles.card, styles.welcome, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <ThemedText themeColor="gold" style={styles.welcomeCross}>
            ✝
          </ThemedText>
          <ThemedText style={styles.welcomeTitle}>Welcome back to your faith community</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            Sign in to comment, save content across devices, submit prayer requests, and give.
            You can keep browsing public media and saints without an account.
          </ThemedText>
          <Button label="SIGN IN" onPress={() => router.push('/sign-in')} style={styles.fullWidth} />
          <Button
            label="JOIN THE FAMILY"
            variant="secondary"
            onPress={() => router.push('/register')}
            style={styles.fullWidth}
          />
        </View>

        <Button label="SUPPORT THE MISSION" variant="ghost" onPress={() => router.push('/donate')} />
      </View>
    </ScrollView>
  );
}

// ── Small pieces ───────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { borderColor: color }]}>
      <ThemedText style={[styles.badgeText, { color }]}>{label}</ThemedText>
    </View>
  );
}

function StatTile({ label, value, onPress }: { label: string; value?: number; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.statTile,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <ThemedText style={styles.statValue}>{value ?? '—'}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function MenuRow({
  glyph,
  label,
  hint,
  onPress,
  last = false,
}: {
  glyph: string;
  label: string;
  hint?: string;
  onPress: () => void;
  last?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <ThemedText themeColor="gold" style={styles.menuGlyph}>
        {glyph}
      </ThemedText>
      <View style={styles.menuCopy}>
        <ThemedText style={styles.menuLabel}>{label}</ThemedText>
        {hint ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
      <ThemedText themeColor="textSecondary" style={styles.menuChevron}>
        ›
      </ThemedText>
    </Pressable>
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
  pageTitle: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 26,
    lineHeight: 32,
    color: '#f3f6fa',
  },

  card: { borderWidth: 1, borderRadius: 12, padding: Spacing.three, gap: Spacing.three },

  identityRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'center' },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 20, fontWeight: '800' },
  identityText: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontFamily: Fonts.serif, fontWeight: '700', fontSize: 17, color: '#f3f6fa' },
  badges: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 2 },
  badgeText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.4 },

  statsRow: { flexDirection: 'row', gap: Spacing.two + 2 },
  statTile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { fontFamily: Fonts.serif, fontWeight: '700', fontSize: 22, color: '#f3f6fa' },
  statLabel: { fontSize: 12, letterSpacing: 0.3 },

  menu: { padding: 0, gap: 0, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
  },
  menuGlyph: { fontSize: 16, width: 22, textAlign: 'center' },
  menuCopy: { flex: 1, minWidth: 0, gap: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#f3f6fa' },
  menuChevron: { fontSize: 20 },

  sectionLabel: { fontSize: 11, letterSpacing: 0.7, opacity: 0.8 },
  activityList: { gap: Spacing.two },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  activityDot: { width: 6, height: 6, borderRadius: 3 },
  activityText: { flex: 1 },

  welcome: { alignItems: 'center', gap: Spacing.two + 2, padding: Spacing.four },
  welcomeCross: { fontSize: 26 },
  welcomeTitle: {
    fontFamily: Fonts.serif,
    fontWeight: '700',
    fontSize: 19,
    lineHeight: 25,
    textAlign: 'center',
    color: '#f3f6fa',
  },
  center: { textAlign: 'center', lineHeight: 20 },
  fullWidth: { width: '100%' },

  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
