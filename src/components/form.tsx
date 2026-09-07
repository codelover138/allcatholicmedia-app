import { forwardRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// ── Labelled text input with a gold focus ring and inline error, per the brand
//    guide ("visible gold focus ring", "8px radii for controls").
type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  /** Right-side adornment (e.g. a show/hide toggle). */
  accessory?: React.ReactNode;
};

export const Field = forwardRef<TextInput, FieldProps>(function Field(
  { label, error, hint, accessory, style, onFocus, onBlur, ...rest },
  ref,
) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.gold : theme.border;

  return (
    <View style={styles.fieldRoot}>
      <ThemedText type="smallBold" style={styles.label}>
        {label}
      </ThemedText>
      <View
        style={[
          styles.inputShell,
          { backgroundColor: theme.backgroundElement, borderColor },
          rest.multiline && styles.inputShellMultiline,
          focused && !error && styles.inputShellFocused,
        ]}>
        <TextInput
          ref={ref}
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }, style]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
      </View>
      {error ? (
        <ThemedText type="small" style={[styles.helper, { color: theme.danger }]}>
          {error}
        </ThemedText>
      ) : hint ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.helper}>
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
});

export function PasswordField(props: Omit<FieldProps, 'accessory' | 'secureTextEntry'>) {
  const theme = useTheme();
  const [hidden, setHidden] = useState(true);
  return (
    <Field
      {...props}
      secureTextEntry={hidden}
      autoCapitalize="none"
      autoCorrect={false}
      accessory={
        <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10}>
          <ThemedText type="small" style={{ color: theme.blue }}>
            {hidden ? 'Show' : 'Hide'}
          </ThemedText>
        </Pressable>
      }
    />
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
}) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const palette: Record<ButtonVariant, { bg: string; border: string; fg: string; pressed: string }> = {
    primary: { bg: theme.gold, border: theme.gold, fg: '#0d1f3c', pressed: theme.goldPressed },
    secondary: {
      bg: theme.backgroundSelected,
      border: theme.border,
      fg: theme.text,
      pressed: theme.backgroundElement,
    },
    ghost: { bg: 'transparent', border: theme.text, fg: theme.text, pressed: theme.backgroundElement },
    danger: { bg: 'transparent', border: theme.danger, fg: theme.danger, pressed: theme.backgroundElement },
  };
  const c = palette[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? c.pressed : c.bg, borderColor: c.border },
        isDisabled && styles.buttonDisabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={c.fg} />
      ) : (
        <ThemedText type="smallBold" style={[styles.buttonLabel, { color: c.fg }]}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

/** Top-of-form error banner for a request-level failure. */
export function FormError({ message }: { message?: string | null }) {
  const theme = useTheme();
  if (!message) return null;
  return (
    <View style={[styles.banner, { borderColor: theme.danger, backgroundColor: 'rgba(255,107,107,0.08)' }]}>
      <ThemedText type="small" style={{ color: theme.danger }}>
        {message}
      </ThemedText>
    </View>
  );
}

/** Success / info banner. */
export function FormNotice({ message, tone = 'success' }: { message?: string | null; tone?: 'success' | 'info' }) {
  const theme = useTheme();
  if (!message) return null;
  const color = tone === 'success' ? theme.success : theme.blue;
  return (
    <View style={[styles.banner, { borderColor: color, backgroundColor: 'rgba(93,209,160,0.08)' }]}>
      <ThemedText type="small" style={{ color }}>
        {message}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  fieldRoot: { gap: Spacing.one + 2 },
  label: { fontSize: 12.5, letterSpacing: 0.4, opacity: 0.9 },
  inputShell: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: Spacing.three - 2,
    minHeight: 48,
  },
  inputShellMultiline: { alignItems: 'stretch', minHeight: 96, paddingVertical: Spacing.two },
  inputShellFocused: {
    shadowColor: '#c9a227',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: Spacing.two + 2 },
  accessory: { paddingLeft: Spacing.two },
  helper: { fontSize: 12, lineHeight: 16 },

  button: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  buttonDisabled: { opacity: 0.55 },
  buttonLabel: { letterSpacing: 0.6, fontFamily: Fonts.sans },

  banner: {
    borderWidth: 1,
    borderRadius: 10,
    padding: Spacing.three - 2,
  },
});
