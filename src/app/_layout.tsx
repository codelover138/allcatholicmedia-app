import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ArticleDetailHost } from '@/components/article-detail';
import { AudioPlayerBar } from '@/components/audio-player-bar';
import { LockGate } from '@/components/lock-gate';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { useAuth } from '@/lib/auth-store';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void useAuth.getState().hydrate();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <LockGate />
        <AudioPlayerBar />
        <VideoPlayerModal />
        <ArticleDetailHost />
      </ThemeProvider>
    </QueryClientProvider>
  );
}


