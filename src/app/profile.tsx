import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AppHeader } from '@/components/app-header';
import { ScreenBackground } from '@/components/screen-background';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const theme = useTheme();
  return <ScreenBackground><SafeAreaView edges={['top']} style={[styles.safe, { backgroundColor: 'transparent' }]}><AppHeader /><View style={styles.content}><ThemedText type="subtitle" style={styles.title}>Profile</ThemedText><ThemedView style={[styles.welcome, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}><ThemedText themeColor="gold" style={styles.cross}>+</ThemedText><ThemedText type="subtitle" style={styles.welcomeTitle}>Welcome back to your faith community</ThemedText><ThemedText type="small" themeColor="textSecondary" style={styles.center}>Sign in to comment, save content, submit prayer requests, and give.</ThemedText><Pressable style={styles.goldButton}><ThemedText type="smallBold" style={styles.goldButtonText}>SIGN IN</ThemedText></Pressable><Pressable style={[styles.joinButton, { backgroundColor: theme.backgroundSelected }]}><ThemedText type="smallBold">JOIN THE FAMILY</ThemedText></Pressable></ThemedView><Pressable style={[styles.support, { borderColor: theme.text }]}><ThemedText type="smallBold">SUPPORT THE MISSION</ThemedText></Pressable></View></SafeAreaView></ScreenBackground>;
}
const styles = StyleSheet.create({ safe: { flex: 1 }, content: { padding: 18, gap: 14 }, title: { fontSize: 25, lineHeight: 30 }, welcome: { borderWidth: 1, borderRadius: 14, padding: 22, alignItems: 'center', gap: 14 }, cross: { fontSize: 24, fontWeight: 700 }, welcomeTitle: { fontSize: 19, lineHeight: 24, textAlign: 'center' }, center: { textAlign: 'center' }, goldButton: { backgroundColor: '#c9a227', borderRadius: 99, width: '100%', alignItems: 'center', padding: 12 }, goldButtonText: { color: '#0d1f3c', letterSpacing: 0.7 }, joinButton: { borderRadius: 99, width: '100%', alignItems: 'center', padding: 12 }, support: { borderWidth: 1, borderRadius: 99, alignItems: 'center', padding: 12 } });
