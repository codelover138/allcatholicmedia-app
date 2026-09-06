import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { VideoPlayerProvider } from '@/components/video-player';
import { Colors } from '@/constants/theme';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const base = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  // Transparent nav background so each screen's own ScreenBackdrop is visible.
  const navTheme = { ...base, colors: { ...base.colors, background: 'transparent' } };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navTheme}>
        <VideoPlayerProvider>
          <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
            <AnimatedSplashOverlay />
            <AppTabs />
          </View>
        </VideoPlayerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
