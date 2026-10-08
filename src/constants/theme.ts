/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1c1613',
    textSecondary: '#6e5f54',
    textMuted: '#9e8e82',
    background: '#f8f6f2',
    backgroundElement: '#ffffff',
    backgroundSelected: '#f2e8d8',
    backgroundElevated: '#ffffff',
    border: '#e7dfd4',
    borderLight: '#f3ede4',
    accent: '#801429',
    accentSoft: '#ba3048',
    accentLight: '#fdf0f2',
    gold: '#b8860b',
    goldSoft: '#f9f4e8',
    live: '#d92534',
    liveSoft: 'rgba(217, 37, 52, 0.1)',
    cardShadow: 'rgba(28, 22, 19, 0.05)',
    glass: 'rgba(255, 255, 255, 0.85)',
  },
  dark: {
    text: '#f5eee6',
    textSecondary: '#a8988b',
    textMuted: '#786a5e',
    background: '#120e0c',
    backgroundElement: '#1c1613',
    backgroundSelected: '#32261e',
    backgroundElevated: '#251e19',
    border: '#2e2520',
    borderLight: '#241c17',
    accent: '#e85d75',
    accentSoft: '#c74259',
    accentLight: '#2c171b',
    gold: '#e5b854',
    goldSoft: '#2a2418',
    live: '#ff4d5a',
    liveSoft: 'rgba(255, 77, 90, 0.15)',
    cardShadow: 'rgba(0, 0, 0, 0.4)',
    glass: 'rgba(28, 22, 19, 0.85)',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
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
  oneHalf: 6,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const Radius = {
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  full: 9999,
} as const;

export const BottomTabInset = Platform.select({ ios: 60, android: 80, web: 76 }) ?? 60;
export const MaxContentWidth = 840;

