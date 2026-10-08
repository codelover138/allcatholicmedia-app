import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrayerRequestModal } from '@/components/prayer-request-modal';
import { EmptyState, ErrorState, LoadingState } from '@/components/query-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appContentApi, resolveImageUrl, type ArticleDTO } from '@/lib/app-content';
import { useAppStore, type SavedItem } from '@/lib/app-store';

const MINISTRY_ACTIONS = [
  {
    key: 'prayer',
    label: 'Prayer Request',
    subtitle: 'Submit your prayer intentions to Fr. Morsin Livingston & ministry',
    icon: 'hand-left-outline' as const,
    badge: 'Open Form',
    color: 'accent' as const,
  },
  {
    key: 'donate',
    label: 'Donate & Support',
    subtitle: 'Support Fr. Morsin Livingston evangelical outreach & media',
    icon: 'heart-outline' as const,
    badge: 'Support Us',
    color: 'gold' as const,
  },
  {
    key: 'account',
    label: 'Sign in / Account',
    subtitle: 'Access personal bookmarks, prayer history, and notifications',
    icon: 'person-circle-outline' as const,
    badge: 'Member',
    color: 'accent' as const,
  },
  {
    key: 'settings',
    label: 'App Settings & Preferences',
    subtitle: 'Theme customization, audio playback, & notification alerts',
    icon: 'options-outline' as const,
    badge: 'Preferences',
    color: 'accent' as const,
  },
];

export default function MoreScreen() {
  const theme = useTheme();
  const [prayerModalOpen, setPrayerModalOpen] = useState(false);
  const savedItems = useAppStore((state) => state.savedItems);
  const toggleSaveItem = useAppStore((state) => state.toggleSaveItem);

  const saintsQuery = useQuery({
    queryKey: ['app', 'saints'],
    queryFn: () => appContentApi.saints(),
  });

  const saints = saintsQuery.data?.data.saints ?? [];

  return (
    <>
      <ScrollView style={[styles.flex, { backgroundColor: theme.background }]} contentContainerStyle={styles.scrollContent}>
        <SafeAreaView edges={['top']} style={styles.safeContainer}>
          <View style={styles.maxContainer}>
            <View style={styles.header}>
              <ThemedText type="sectionHeader" themeColor="gold">
                COMMUNITY & MINISTRY
              </ThemedText>
              <ThemedText type="heroTitle" style={styles.title}>
                More & Support
              </ThemedText>
            </View>

            {/* About Fr. Morsin Livingston & All Catholic Media Hero Card */}
            <View style={{ paddingHorizontal: Spacing.four, marginBottom: Spacing.four }}>
              <View style={[styles.shepherdHeroCard, { backgroundColor: '#7A1227' }]}>
                <View style={styles.shepherdTopRow}>
                  <View style={[styles.shepherdIconWrap, { backgroundColor: 'rgba(184, 134, 11, 0.25)' }]}>
                    <Ionicons name="sparkles" size={20} color="#ffd700" />
                  </View>
                  <View style={styles.shepherdBadgePill}>
                    <ThemedText type="badge" style={{ color: '#ffd700' }}>
                      FOUNDER & SHEPHERD
                    </ThemedText>
                  </View>
                </View>

                <ThemedText type="heroTitle" style={{ color: '#ffffff', fontSize: 22, lineHeight: 28, marginTop: Spacing.one }}>
                  Fr. Morsin Livingston
                </ThemedText>

                <ThemedText type="small" style={{ color: 'rgba(255, 255, 255, 0.92)', lineHeight: 20, marginTop: Spacing.half }}>
                  Fr. Morsin Livingston is the owner and shepherd running All Catholic Media. Dedicated to bringing the Holy Mass, daily Gospel homilies, Rosary devotions, and Catholic television to believers across the globe.
                </ThemedText>

                <View style={styles.shepherdBtnRow}>
                  <Pressable
                    onPress={() => setPrayerModalOpen(true)}
                    style={({ pressed }) => [
                      styles.shepherdPrimaryBtn,
                      { backgroundColor: theme.gold },
                      pressed && styles.pressed,
                    ]}>
                    <Ionicons name="hand-left" size={16} color="#ffffff" />
                    <ThemedText type="smallBold" style={{ color: '#ffffff' }}>
                      Submit Prayer Intention
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Saved Bookmarks Section */}
            {savedItems.length > 0 ? (
              <View style={styles.sectionHeaderWrap}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="bookmark" size={16} color={theme.gold} />
                  <ThemedText type="sectionHeader" themeColor="gold">
                    MY SAVED BOOKMARKS ({savedItems.length})
                  </ThemedText>
                </View>
                <View style={styles.savedGrid}>
                  {savedItems.map((item) => (
                    <ThemedView key={`${item.type}-${item.id}`} variant="elevated" style={styles.savedCard}>
                      <View style={styles.savedCardContent}>
                        <ThemedText type="badge" themeColor="accent">
                          {item.type.toUpperCase()}
                        </ThemedText>
                        <ThemedText type="subtitle" numberOfLines={1} style={styles.savedTitle}>
                          {item.title}
                        </ThemedText>
                      </View>

                      <Pressable
                        onPress={() => toggleSaveItem(item)}
                        style={({ pressed }) => [styles.removeBookmarkBtn, pressed && { opacity: 0.7 }]}>
                        <Ionicons name="trash-outline" size={16} color={theme.accent} />
                      </Pressable>
                    </ThemedView>
                  ))}
                </View>
              </View>
            ) : null}

            {/* Saints & Feast Days Carousel Section */}
            <View style={styles.sectionHeaderWrap}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="sparkles" size={16} color={theme.gold} />
                <ThemedText type="sectionHeader" themeColor="gold">
                  SAINTS & LITURGICAL FEAST DAYS
                </ThemedText>
              </View>
            </View>

            {saintsQuery.isLoading ? <LoadingState message="Loading saints..." /> : null}
            {saintsQuery.isError ? (
              <ErrorState message="Could not load saints." onRetry={() => saintsQuery.refetch()} />
            ) : null}
            {saintsQuery.data && saints.length === 0 ? <EmptyState message="No saints listed yet." /> : null}

            {saints.length > 0 ? (
              <FlatList
                data={saints}
                keyExtractor={(saint) => String(saint.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.saintsList}
                renderItem={({ item }) => <SaintCard saint={item} />}
              />
            ) : null}

            {/* Ministry Actions & Settings Section */}
            <View style={[styles.sectionHeaderWrap, { marginTop: Spacing.four }]}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="grid-outline" size={16} color={theme.accent} />
                <ThemedText type="sectionHeader" themeColor="accent">
                  MINISTRY HUB & SERVICES
                </ThemedText>
              </View>
            </View>

            <View style={styles.actionsGrid}>
              {MINISTRY_ACTIONS.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={item.key === 'prayer' ? () => setPrayerModalOpen(true) : undefined}
                  style={({ pressed }) => [styles.actionPressable, pressed && styles.pressed]}>
                  <ThemedView
                    variant={item.key === 'donate' ? 'gold' : 'elevated'}
                    style={styles.actionCard}>
                    <View style={styles.actionCardTopRow}>
                      <View
                        style={[
                          styles.actionIconBadge,
                          {
                            backgroundColor:
                              item.key === 'donate' ? 'rgba(184, 134, 11, 0.15)' : theme.accentLight,
                          },
                        ]}>
                        <Ionicons
                          name={item.icon}
                          size={22}
                          color={item.key === 'donate' ? theme.gold : theme.accent}
                        />
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              item.key === 'prayer' ? theme.accentLight : theme.borderLight,
                          },
                        ]}>
                        <ThemedText
                          type="badge"
                          themeColor={item.key === 'prayer' ? 'accent' : 'textSecondary'}>
                          {item.badge}
                        </ThemedText>
                      </View>
                    </View>

                    <View style={styles.actionBody}>
                      <ThemedText type="subtitle" style={styles.actionTitle}>
                        {item.label}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {item.subtitle}
                      </ThemedText>
                    </View>

                    <View style={styles.actionFooter}>
                      <ThemedText
                        type="smallBold"
                        style={{ color: item.key === 'donate' ? theme.gold : theme.accent }}>
                        {item.key === 'prayer' ? 'Submit Request' : 'Explore Option'}
                      </ThemedText>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={item.key === 'donate' ? theme.gold : theme.accent}
                      />
                    </View>
                  </ThemedView>
                </Pressable>
              ))}
            </View>

            {/* Ministry Footer Notice */}
            <View style={styles.appFooter}>
              <Ionicons name="sparkles-outline" size={20} color={theme.gold} />
              <ThemedText type="smallBold" themeColor="gold">
                All Catholic Media App v2.4.0
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                Shepherded & Founded by Fr. Morsin Livingston. All rights reserved.
              </ThemedText>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>

      <PrayerRequestModal visible={prayerModalOpen} onClose={() => setPrayerModalOpen(false)} />
    </>
  );
}

function SaintCard({ saint }: { saint: ArticleDTO }) {
  const theme = useTheme();
  const saintImage =
    resolveImageUrl(saint.image) ||
    'https://images.unsplash.com/photo-1548625361-180800b55a30?auto=format&fit=crop&w=400&q=80';

  return (
    <Pressable style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView variant="elevated" style={styles.saintCard}>
        <Image source={{ uri: saintImage }} style={styles.saintThumb} contentFit="cover" />
        <View style={styles.saintBodyWrap}>
          <View style={[styles.saintBadgePill, { backgroundColor: theme.goldSoft }]}>
            <Ionicons name="sparkles" size={10} color={theme.gold} />
            <ThemedText type="badge" themeColor="gold">
              HOLY FEAST DAY
            </ThemedText>
          </View>
          <ThemedText type="subtitle" numberOfLines={2} style={styles.saintName}>
            {saint.title}
          </ThemedText>
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  safeContainer: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
  maxContainer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.half,
  },
  title: {
    marginTop: Spacing.half,
  },
  shepherdHeroCard: {
    padding: Spacing.four,
    borderRadius: Radius.large,
    gap: Spacing.two,
  },
  shepherdTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shepherdIconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shepherdBadgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  shepherdBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  shepherdPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
  },
  appFooter: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.six,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.four,
  },
  sectionHeaderWrap: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.oneHalf,
  },
  savedGrid: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
  },
  savedCardContent: {
    flex: 1,
    gap: 2,
    marginRight: Spacing.two,
  },
  savedTitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  removeBookmarkBtn: {
    padding: Spacing.one,
  },
  saintsList: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  saintCard: {
    width: 160,
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  saintThumb: {
    width: '100%',
    height: 100,
  },
  saintBodyWrap: {
    padding: Spacing.two,
    gap: 4,
  },
  saintBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.oneHalf,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  saintName: {
    fontSize: 14,
    lineHeight: 18,
  },
  actionsGrid: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  actionPressable: {
    width: '100%',
  },
  actionCard: {
    padding: Spacing.four,
    gap: Spacing.three,
    borderRadius: Radius.large,
  },
  actionCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionIconBadge: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  actionBody: {
    gap: Spacing.one,
  },
  actionTitle: {
    fontSize: 18,
    lineHeight: 24,
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.one,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  pressed: {
    opacity: 0.85,
  },
});

