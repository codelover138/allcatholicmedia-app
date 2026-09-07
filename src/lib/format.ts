/**
 * Durations from the API rendered as "26 min". Accepts an ISO-8601 string
 * (`PT25M44S`) or a plain number of seconds (the v1 episode resource returns
 * seconds).
 */
export function formatDuration(value: string | number | null | undefined): string | null {
  if (value == null || value === '') return null;

  let totalSeconds: number | null = null;
  if (typeof value === 'number') {
    totalSeconds = value;
  } else if (/^\d+$/.test(value.trim())) {
    totalSeconds = Number(value.trim());
  } else {
    const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(value.trim());
    if (!match) return null;
    const [, h, m, s] = match;
    totalSeconds = Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
  }
  if (totalSeconds == null || Number.isNaN(totalSeconds)) return null;

  const minutes = Math.round(totalSeconds / 60);
  if (minutes >= 60) {
    const hrs = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem ? `${hrs} hr ${rem} min` : `${hrs} hr`;
  }
  return `${Math.max(1, minutes)} min`;
}

/** Seconds → `m:ss` or `h:mm:ss`, for a player scrubber. */
export function formatClock(seconds: number | null | undefined): string {
  if (seconds == null || Number.isNaN(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  return `${h > 0 ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}

/** API timestamps (`2026-09-05T12:38:40-04:00`) rendered as "Sep 5". */
export function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
