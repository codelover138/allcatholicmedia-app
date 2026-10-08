import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type SavedItem = {
  id: string;
  type: 'article' | 'podcast' | 'saint' | 'stream';
  title: string;
  subtitle?: string;
  image?: string;
  url?: string;
  savedAt: string;
};

export type AudioTrack = {
  id: string;
  title: string;
  showName: string;
  audioUrl: string;
  artwork?: string;
  duration?: string;
};

type AppState = {
  // Saved / Bookmarks
  savedItems: SavedItem[];
  toggleSaveItem: (item: Omit<SavedItem, 'savedAt'>) => void;
  isItemSaved: (id: string, type: SavedItem['type']) => boolean;

  // Active Audio Player State
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  playTrack: (track: AudioTrack) => void;
  pauseTrack: () => void;
  resumeTrack: () => void;
  stopTrack: () => void;

  // Active Video Modal State
  activeVideoUrl: string | null;
  activeVideoTitle: string | null;
  openVideoModal: (url: string, title: string) => void;
  closeVideoModal: () => void;

  // Daily Prayer Community State
  dailyPrayerCount: number;
  userPrayedToday: boolean;
  recordTodayPrayer: () => void;
};

// Storage engine cross-platform wrapper
const customStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      savedItems: [],

      toggleSaveItem: (item) => {
        const { savedItems } = get();
        const exists = savedItems.some((i) => i.id === item.id && i.type === item.type);

        if (exists) {
          set({
            savedItems: savedItems.filter((i) => !(i.id === item.id && i.type === item.type)),
          });
        } else {
          set({
            savedItems: [
              { ...item, savedAt: new Date().toISOString() },
              ...savedItems,
            ],
          });
        }
      },

      isItemSaved: (id, type) => {
        return get().savedItems.some((i) => i.id === id && i.type === type);
      },

      // Audio State
      currentTrack: null,
      isPlaying: false,

      playTrack: (track) => {
        set({ currentTrack: track, isPlaying: true });
      },

      pauseTrack: () => {
        set({ isPlaying: false });
      },

      resumeTrack: () => {
        set({ isPlaying: true });
      },

      stopTrack: () => {
        set({ currentTrack: null, isPlaying: false });
      },

      // Video State
      activeVideoUrl: null,
      activeVideoTitle: null,

      openVideoModal: (url, title) => {
        set({ activeVideoUrl: url, activeVideoTitle: title });
      },

      closeVideoModal: () => {
        set({ activeVideoUrl: null, activeVideoTitle: null });
      },

      // Prayer Counter State
      dailyPrayerCount: 1420,
      userPrayedToday: false,

      recordTodayPrayer: () => {
        const { userPrayedToday, dailyPrayerCount } = get();
        if (!userPrayedToday) {
          set({ userPrayedToday: true, dailyPrayerCount: dailyPrayerCount + 1 });
        }
      },
    }),
    {
      name: 'allcatholicmedia-app-storage',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({
        savedItems: state.savedItems,
        userPrayedToday: state.userPrayedToday,
      }),
    }
  )
);
