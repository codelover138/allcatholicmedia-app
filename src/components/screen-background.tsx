import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenBackdrop } from '@/components/screen-backdrop';

/**
 * Wrap a screen's content so the St. Peter's Basilica backdrop sits behind it,
 * covering the full window (status-bar strip included). Put this as the screen's
 * outermost element; keep the inner container's background transparent.
 */
export function ScreenBackground({ children }: { children: ReactNode }) {
  return (
    <View style={styles.root}>
      <ScreenBackdrop />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
