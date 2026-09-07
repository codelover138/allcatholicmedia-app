import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { create } from 'zustand';

/**
 * On-device podcast downloads. Files live under `<documents>/acm-downloads/`;
 * a `manifest.json` alongside them records the metadata so the Downloads screen
 * and the player can work offline. Everything is a no-op on web.
 */

export type DownloadEntry = {
  episodeId: number;
  title: string;
  showName?: string;
  artwork?: string | null;
  /** `file://` URI of the saved audio. */
  localUri: string;
  size: number;
  downloadedAt: string;
};

type DownloadState = {
  ready: boolean;
  entries: Record<string, DownloadEntry>;
  /** Transient per-episode status while a download is running. */
  active: Record<string, 'downloading' | 'error'>;
  hydrate: () => Promise<void>;
  download: (input: Omit<DownloadEntry, 'localUri' | 'size' | 'downloadedAt'> & { audioUrl: string }) => Promise<void>;
  remove: (episodeId: number) => Promise<void>;
};

const supported = Platform.OS !== 'web';

function dir(): Directory {
  const d = new Directory(Paths.document, 'acm-downloads');
  if (!d.exists) d.create({ intermediates: true, idempotent: true });
  return d;
}

function manifestFile(): File {
  return new File(dir(), 'manifest.json');
}

async function readManifest(): Promise<Record<string, DownloadEntry>> {
  try {
    const f = manifestFile();
    if (!f.exists) return {};
    return JSON.parse(await f.text()) as Record<string, DownloadEntry>;
  } catch {
    return {};
  }
}

function writeManifest(entries: Record<string, DownloadEntry>): void {
  try {
    manifestFile().write(JSON.stringify(entries));
  } catch {
    /* ignore — worst case the manifest is rebuilt next launch from disk */
  }
}

export const useDownloads = create<DownloadState>((set, get) => ({
  ready: !supported,
  entries: {},
  active: {},

  hydrate: async () => {
    if (!supported) {
      set({ ready: true });
      return;
    }
    const stored = await readManifest();
    // Drop entries whose file is gone (cleared cache, manual delete, OS purge).
    const kept: Record<string, DownloadEntry> = {};
    for (const [key, entry] of Object.entries(stored)) {
      try {
        if (new File(entry.localUri).exists) kept[key] = entry;
      } catch {
        /* skip */
      }
    }
    if (Object.keys(kept).length !== Object.keys(stored).length) writeManifest(kept);
    set({ ready: true, entries: kept });
  },

  download: async ({ episodeId, audioUrl, title, showName, artwork }) => {
    if (!supported || !audioUrl) return;
    const key = String(episodeId);
    if (get().entries[key] || get().active[key] === 'downloading') return;

    set((s) => ({ active: { ...s.active, [key]: 'downloading' } }));
    try {
      const target = new File(dir(), `${episodeId}.mp3`);
      const saved = await File.downloadFileAsync(audioUrl, target, { idempotent: true });
      const entry: DownloadEntry = {
        episodeId,
        title,
        showName,
        artwork,
        localUri: saved.uri,
        size: saved.size ?? 0,
        downloadedAt: new Date().toISOString(),
      };
      set((s) => {
        const entries = { ...s.entries, [key]: entry };
        writeManifest(entries);
        const active = { ...s.active };
        delete active[key];
        return { entries, active };
      });
    } catch {
      set((s) => ({ active: { ...s.active, [key]: 'error' } }));
    }
  },

  remove: async (episodeId) => {
    const key = String(episodeId);
    const entry = get().entries[key];
    if (entry) {
      try {
        const f = new File(entry.localUri);
        if (f.exists) f.delete();
      } catch {
        /* ignore */
      }
    }
    set((s) => {
      const entries = { ...s.entries };
      delete entries[key];
      writeManifest(entries);
      const active = { ...s.active };
      delete active[key];
      return { entries, active };
    });
  },
}));

/** `file://` URI for an episode if it's downloaded, else null. */
export function localAudioFor(episodeId: number): string | null {
  return useDownloads.getState().entries[String(episodeId)]?.localUri ?? null;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

export const downloadsSupported = supported;
