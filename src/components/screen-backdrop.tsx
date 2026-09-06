import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { BACKDROP_SOURCE } from '@/constants/backdrop';
import { useTheme } from '@/hooks/use-theme';

/**
 * The fixed atmosphere behind every screen: a St. Peter's Basilica photo (when
 * one is set in `@/constants/backdrop`), a navy scrim that keeps headings and
 * body text legible, a stronger fade over the lower half so scrolled content
 * stays readable, and a restrained gold glow near the top — matching the site's
 * hero treatment. Falls back to a plain navy ground + glow when no image is set.
 *
 * Rendered once at the root; screens keep their own containers transparent so
 * this shows through the page gutters while cards stay solid on top.
 */
export function ScreenBackdrop() {
  const theme = useTheme();
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
      {BACKDROP_SOURCE ? (
        <>
          <Image
            source={BACKDROP_SOURCE}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={500}
          />
          <View style={[StyleSheet.absoluteFill, styles.scrim]} />
          <View style={styles.bottomFade} />
          <View style={styles.bottomSolid} />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.scrimOnly]} />
      )}
      <View style={styles.glow} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Over the photo: enough to hold white headings, still shows the basilica.
  scrim: { backgroundColor: 'rgba(10,15,31,0.55)' },
  // No photo: plain heavy navy wash.
  scrimOnly: { backgroundColor: 'rgba(9,14,29,0.74)' },
  // Two stacked bands stand in for a gradient toward solid navy lower down.
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: 'rgba(15,24,48,0.55)',
  },
  bottomSolid: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '30%',
    backgroundColor: 'rgba(15,24,48,0.9)',
  },
  glow: {
    position: 'absolute',
    top: -170,
    alignSelf: 'center',
    width: 540,
    height: 430,
    borderRadius: 270,
    backgroundColor: 'rgba(201,162,39,0.07)',
  },
});
