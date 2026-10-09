/**
 * Classic Sacred Liturgical Theme for All Catholic Media.
 * Deep Garnet Crimson (#7A0C1E), Radiant Liturgical Gold (#D4AF37),
 * Sanctuary Dark Blue (#0A0F1D) and Sacred Cream Text (#F7F4EF).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1F1916',
    textSecondary: '#665A52',
    textMuted: '#968A80',
    background: '#F7F3EB',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EFE7D8',
    backgroundElevated: '#FFFFFF',
    border: '#E2D7C5',
    borderLight: '#F0E8DC',
    accent: '#7A0C1E', // Liturgical Garnet
    accentSoft: '#A61B32',
    accentLight: '#FCECEF',
    gold: '#B8860B', // Metallic Gold
    goldSoft: '#FAF3DC',
    goldPressed: '#8A6405',
    danger: '#B31B27',
    success: '#1B7A38',
    blue: '#1A5A96',
    live: '#C91C28',
    liveSoft: 'rgba(201, 28, 40, 0.1)',
    cardShadow: 'rgba(31, 25, 22, 0.08)',
    glass: 'rgba(255, 255, 255, 0.92)',
  },
  dark: {
    text: '#F7F4EF', // Sacred Warm Cream Text
    textSecondary: '#C4BBAF',
    textMuted: '#8C8275',
    background: '#0A0F1D', // Deep Sanctuary Navy
    backgroundElement: '#141A2E', // Elevated Sanctuary Dark Card
    backgroundSelected: '#202840',
    backgroundElevated: '#1A223B',
    border: '#2A3452',
    borderLight: '#1F273D',
    accent: '#A61B32', // Liturgical Crimson Red
    accentSoft: '#C72A43',
    accentLight: '#2C060C',
    gold: '#D4AF37', // Radiant Liturgical Gold Foil
    goldSoft: '#3D3212',
    goldPressed: '#F3CF55',
    danger: '#E5484D',
    success: '#30A46C',
    blue: '#3E9BEE',
    live: '#E5484D',
    liveSoft: 'rgba(229, 72, 77, 0.18)',
    cardShadow: 'rgba(0, 0, 0, 0.5)',
    glass: 'rgba(14, 20, 36, 0.9)',
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
