export function isCooldownActive(lastScanAt: number, cooldownMs = 10_000): boolean {
  return Date.now() - lastScanAt < cooldownMs;
}

export function isDailyLimitReached(
  dailyScanCount: number,
  lastScanDate: string,
  limit = 50
): { limited: boolean; count: number } {
  const today = new Date().toISOString().slice(0, 10);
  const count = lastScanDate === today ? dailyScanCount : 0;
  return { limited: count >= limit, count };
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}
