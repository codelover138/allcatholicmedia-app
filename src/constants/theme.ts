/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#241b17',
    background: '#f7f3ee',
    backgroundElement: '#fffdfb',
    backgroundSelected: '#e8dcbd',
    textSecondary: '#5b4f47',
    border: '#e3d9cd',
    accent: '#7a1f2b',
    accentSoft: '#a8434f',
    gold: '#a9812f',
    goldSoft: '#e8dcbd',
    live: '#a8323a',
  },
  dark: {
    text: '#efe6db',
    background: '#1a1512',
    backgroundElement: '#211a16',
    backgroundSelected: '#3a3020',
    textSecondary: '#b8a99b',
    border: '#3a2f28',
    accent: '#d9707c',
    accentSoft: '#c15864',
    gold: '#d4b262',
    goldSoft: '#3a3020',
    live: '#e07a83',
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
    serif: 'serif',
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
