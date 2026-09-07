import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ArticleDetailHost } from '@/components/article-detail';
import { AudioPlayerHost } from '@/components/audio-player';
import AppTabs from '@/components/app-tabs';
import { LockGate } from '@/components/lock-gate';
import { VideoPlayerHost } from '@/components/video-player';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/lib/auth-store';
import { useDownloads } from '@/lib/downloads';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const hydrateAuth = useAuth((s) => s.hydrate);
  const hydrateDownloads = useDownloads((s) => s.hydrate);

  // Restore the saved session + downloads manifest once, on cold start.
  useEffect(() => {
    void hydrateAuth();
    void hydrateDownloads();
  }, [hydrateAuth, hydrateDownloads]);
  const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  // Transparent nav background so each screen's own ScreenBackdrop is visible.
  const navTheme = { ...base, colors: { ...base.colors, background: 'transparent' } };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
          <AnimatedSplashOverlay />
          <AppTabs />
          <AudioPlayerHost />
          <VideoPlayerHost />
          <ArticleDetailHost />
          <LockGate />
        </View>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
