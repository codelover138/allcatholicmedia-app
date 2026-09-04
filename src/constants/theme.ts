/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#f3f6fa',
    background: '#0f1830',
    backgroundElement: '#1b2740',
    backgroundSelected: '#212f4e',
    textSecondary: '#b9c4d6',
    border: '#2a3b5c',
    accent: '#f3f6fa',
    accentSoft: '#d8e2f1',
    gold: '#c9a227',
    goldSoft: '#2e2a1b',
    live: '#ff7d7d',
  },
  dark: {
    text: '#f3f6fa',
    background: '#0f1830',
    backgroundElement: '#1b2740',
    backgroundSelected: '#212f4e',
    textSecondary: '#b9c4d6',
    border: '#2a3b5c',
    accent: '#f3f6fa',
    accentSoft: '#d8e2f1',
    gold: '#c9a227',
    goldSoft: '#2e2a1b',
    live: '#ff7d7d',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'Georgia',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
