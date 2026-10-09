import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Pressable, View, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  return (
    <Tabs style={{ flex: 1 }}>
      <TabList asChild style={styles.topTabList}>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon="home-outline" activeIcon="home">
              Home
            </TabButton>
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <TabButton icon="compass-outline" activeIcon="compass">
              Explore
            </TabButton>
          </TabTrigger>
          <TabTrigger name="pray" href="/pray" asChild>
            <TabButton icon="hand-left-outline" activeIcon="hand-left">
              Pray
            </TabButton>
          </TabTrigger>
          <TabTrigger name="community" href="/community" asChild>
            <TabButton icon="people-outline" activeIcon="people">
              Community
            </TabButton>
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabButton icon="person-outline" activeIcon="person">
              Profile
            </TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
      <TabSlot style={styles.slotContent} />
    </Tabs>
  );
}

export function TabButton({
  children,
  isFocused,
  icon,
  activeIcon,
  ...props
}: TabTriggerSlotProps & { icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }) {
  const theme = useTheme();

  return (
    <Pressable {...props} style={({ pressed }) => [styles.tabPressable, pressed && styles.pressed]}>
      <View
        style={[
          styles.tabButtonView,
          {
            backgroundColor: isFocused ? theme.accentLight : 'transparent',
            borderColor: isFocused ? theme.accentSoft : 'transparent',
          },
        ]}>
        <Ionicons
          name={isFocused ? activeIcon : icon}
          size={16}
          color={isFocused ? theme.accent : theme.textSecondary}
        />
        <ThemedText
          type="smallBold"
          style={[
            styles.tabLabel,
            { color: isFocused ? theme.accent : theme.textSecondary },
          ]}>
          {children}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const theme = useTheme();

  return (
    <View {...props} style={styles.tabListContainer}>
      <ThemedView variant="glass" style={[styles.innerContainer, { borderColor: theme.border }]}>
        <Link href="/" asChild>
          <Pressable style={styles.brandContainer}>
            <View style={[styles.brandEmblem, { backgroundColor: theme.accent }]}>
              <Ionicons name="sparkles" size={14} color="#ffffff" />
            </View>
            <View style={styles.brandTextGroup}>
              <ThemedText type="smallBold" style={styles.brandTitle}>
                Fr. Morsin Livingston
              </ThemedText>
              <ThemedText type="badge" themeColor="gold" style={styles.brandSubtitle}>
                ALL CATHOLIC MEDIA
              </ThemedText>
            </View>
          </Pressable>
        </Link>

        <View style={styles.triggersGroup}>{props.children}</View>

        <Link href="/donate" asChild>
          <Pressable
            style={({ pressed }) => [
              styles.donateButton,
              { backgroundColor: theme.gold },
              pressed && { opacity: 0.85 },
            ]}>
            <Ionicons name="heart" size={14} color="#ffffff" />
            <ThemedText type="smallBold" style={{ color: '#ffffff', fontSize: 12 }}>
              Donate
            </ThemedText>
          </Pressable>
        </Link>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  topTabList: {
    zIndex: 100,
  },
  slotContent: {
    flex: 1,
  },
  tabListContainer: {
    position: 'relative',
    width: '100%',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  innerContainer: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.two,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  brandEmblem: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14,
    lineHeight: 16,
  },
  brandSubtitle: {
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.5,
  },
  triggersGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  tabPressable: {
    borderRadius: Radius.full,
  },
  pressed: {
    opacity: 0.75,
  },
  tabButtonView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.oneHalf,
    paddingVertical: Spacing.oneHalf,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 13,
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.oneHalf,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
});

