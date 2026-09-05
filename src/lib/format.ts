/** ISO-8601 durations from the API (`PT25M44S`) rendered as "26 min". */
export function formatDuration(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso.trim());
  if (!match) return null;

  const [, h, m, s] = match;
  const minutes = Number(h ?? 0) * 60 + Number(m ?? 0) + (Number(s ?? 0) >= 30 ? 1 : 0);
  return `${Math.max(1, minutes)} min`;
}

/** API timestamps (`2026-09-05T12:38:40-04:00`) rendered as "Sep 5". */
export function formatShortDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
