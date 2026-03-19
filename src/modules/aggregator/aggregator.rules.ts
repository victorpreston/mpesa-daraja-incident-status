export const FAILURE_THRESHOLD = 3;
export const HEALTH_SCORE_DEGRADED_THRESHOLD = 70;
export const HEALTH_SCORE_OUTAGE_THRESHOLD = 40;
export const WINDOW_SECONDS = 300;

export function computeHealthScore(
  successCount: number,
  failureCount: number,
): number {
  const total = successCount + failureCount;
  if (total === 0) return 100;
  return Math.round((successCount / total) * 100);
}

export function determineSeverity(healthScore: number): string {
  if (healthScore >= HEALTH_SCORE_DEGRADED_THRESHOLD) return 'minor';
  if (healthScore >= HEALTH_SCORE_OUTAGE_THRESHOLD) return 'major';
  return 'critical';
}
