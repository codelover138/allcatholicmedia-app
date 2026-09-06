import * as WebBrowser from 'expo-web-browser';
import { type ReactNode } from 'react';
import { Linking, Platform } from 'react-native';

/** Pull the 11-char video id out of any YouTube watch / embed / short / youtu.be URL. */
export function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const match =
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/.exec(
      input,
    );
  return match ? match[1] : null;
}

/**
 * Open a piece of content without leaving the app. YouTube links open the mobile
 * watch page in an in-app browser sheet (SFSafariViewController / Chrome Custom
 * Tabs) where the video plays; on web it opens a new tab. Non-YouTube links open
 * the same way.
 */
export async function playVideo(url: string | null | undefined) {
  if (!url) return;
  const id = extractYouTubeId(url);
  const target = id ? `https://www.youtube.com/watch?v=${id}` : url;

  if (Platform.OS === 'web') {
    Linking.openURL(target);
    return;
  }

  try {
    await WebBrowser.openBrowserAsync(target, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.OVER_FULL_SCREEN,
      controlsColor: '#c9a227',
      toolbarColor: '#0f1830',
      enableBarCollapsing: true,
    });
  } catch {
    Linking.openURL(target);
  }
}

/** Kept as a hook so screens don't need to change how they call it. */
export function useVideoPlayer() {
  return { play: (url: string | null | undefined, _title?: string) => playVideo(url) };
}

/** No-op wrapper retained so the root layout doesn't need restructuring. */
export function VideoPlayerProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
