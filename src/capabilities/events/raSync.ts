export const RA_SYNC_CRON = '15 19 * * *';
// Weekly slots on Sunday 04:15 KST (Saturday 19:15 UTC); the daily cron tick also drives retries.
export const RA_SYNC_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
export const RA_SYNC_ANCHOR = Date.UTC(2026, 8, 12, 19, 15);

export interface RaEventExclusion {
  raEventId: string;
  title: string;
  excludedAt: number;
}

export interface RaSyncStatus {
  lastStatus: 'never' | 'running' | 'success' | 'failed' | 'not-configured';
  lastStartedAt: number | null;
  lastCompletedAt: number | null;
  lastSuccessAt: number | null;
  lastErrorCode: string | null;
  fetched: number;
  inserted: number;
  skippedExcluded: number;
  nextScheduledAt: number;
  nextRetryAt: number | null;
  exclusions: RaEventExclusion[];
}

export function nextRaSyncTime(now: number): number {
  const periods = Math.max(0, Math.floor((now - RA_SYNC_ANCHOR) / RA_SYNC_INTERVAL_MS) + 1);
  return RA_SYNC_ANCHOR + periods * RA_SYNC_INTERVAL_MS;
}
