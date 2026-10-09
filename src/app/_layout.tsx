import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AudioPlayerBar } from '@/components/audio-player-bar';
import { VideoPlayerModal } from '@/components/video-player-modal';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <AudioPlayerBar />
        <VideoPlayerModal />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

