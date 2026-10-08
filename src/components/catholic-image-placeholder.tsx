import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';

type CatholicImagePlaceholderProps = {
  style?: any;
  title?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
};

const BASILICA_BG_IMAGE = 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=800&q=80';

export function CatholicImagePlaceholder({
  style,
  title,
  iconName = 'book',
  compact = false,
}: CatholicImagePlaceholderProps) {
  return (
    <View style={[styles.container, style]}>
      {/* Basilica Architectural Photo Background */}
      <Image
        source={{ uri: BASILICA_BG_IMAGE }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* Deep Burgundy & Gold Translucent Tint Layer */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(74, 10, 23, 0.78)' }]} />

      {/* Subtle Background Decorative Overlay Rings */}
      <View style={styles.bgRingOuter} />
      <View style={styles.bgRingInner} />

      {/* Decorative Corner Ornaments */}
      {!compact && (
        <>
          <Ionicons name="sparkles" size={12} color="#D4AF37" style={[styles.cornerOrnament, { top: 8, left: 10, opacity: 0.5 }]} />
          <Ionicons name="sparkles" size={12} color="#D4AF37" style={[styles.cornerOrnament, { top: 8, right: 10, opacity: 0.5 }]} />
        </>
      )}

      {/* Main Gold Medallion Badge */}
      <View style={[styles.goldMedallion, compact && styles.goldMedallionCompact]}>
        <Ionicons name={iconName} size={compact ? 20 : 30} color="#FDF8EF" />
      </View>

      {/* Optional Title / Branding */}
      {!compact && (
        <View style={styles.brandingWrap}>
          <ThemedText type="badge" style={styles.brandingText} numberOfLines={1}>
            {title ? title.toUpperCase() : 'ALL CATHOLIC MEDIA'}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#6B0F24',
  },
  bgRingOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
  },
  bgRingInner: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
  },
  cornerOrnament: {
    position: 'absolute',
  },
  goldMedallion: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#801429',
    borderWidth: 2,
    borderColor: '#D4AF37',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  goldMedallionCompact: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
  },
  brandingWrap: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(212, 175, 55, 0.22)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(212, 175, 55, 0.45)',
  },
  brandingText: {
    color: '#FDF8EF',
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
});
