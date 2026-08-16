export const PACK_COOLDOWN_MS = 12 * 60 * 60 * 1000;

export function canOpenPack(lastOpenedAt: number | null, now: number): boolean {
  if (lastOpenedAt === null) {
    return true;
  }
  return now - lastOpenedAt >= PACK_COOLDOWN_MS;
}

/** Milliseconds remaining until the next free pack. 0 if a pack can already be opened. */
export function msUntilNextPack(lastOpenedAt: number | null, now: number): number {
  if (lastOpenedAt === null) {
    return 0;
  }
  return Math.max(0, PACK_COOLDOWN_MS - (now - lastOpenedAt));
}

/** Formats a millisecond duration as HH:MM:SS for the countdown display. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}
