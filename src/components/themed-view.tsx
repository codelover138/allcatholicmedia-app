import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { Radius, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
  variant?: 'default' | 'card' | 'elevated' | 'outlined' | 'accent' | 'gold' | 'glass';
};

export function ThemedView({ style, lightColor, darkColor, type, variant, ...otherProps }: ThemedViewProps) {
  const theme = useTheme();

  const backgroundColor =
    variant === 'accent'
      ? theme.accent
      : variant === 'gold'
        ? theme.goldSoft
        : variant === 'card' || variant === 'elevated'
          ? theme.backgroundElement
          : variant === 'glass'
            ? theme.glass
            : theme[type ?? 'background'];

  return (
    <View
      style={[
        { backgroundColor },
        variant === 'card' && [styles.card, { borderColor: theme.border }],
        variant === 'elevated' && [
          styles.elevated,
          { borderColor: theme.borderLight, shadowColor: theme.cardShadow },
        ],
        variant === 'outlined' && [styles.outlined, { borderColor: theme.border }],
        variant === 'accent' && [styles.card, { borderColor: 'transparent' }],
        variant === 'gold' && [styles.card, { borderColor: theme.border }],
        variant === 'glass' && [styles.glass, { borderColor: theme.border }],
        style,
      ]}
      {...otherProps}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderWidth: 1,
  },
  elevated: {
    borderRadius: Radius.large,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
      },
    }),
  },
  outlined: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  glass: {
    borderRadius: Radius.large,
    borderWidth: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      },
    }),
  },
});

