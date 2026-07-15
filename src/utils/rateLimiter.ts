// src/utils/rateLimiter.ts
// ─── Client-side Rate Limiter to prevent brute-force/spam actions ───

interface LimitWindow {
  timestamps: number[];
}

const actionLog: Record<string, LimitWindow> = {};

/**
 * Client-side Rate Limiter (Sliding Window Log).
 * Returns true if action is allowed, false if rate limit is exceeded.
 * @param actionKey Unique identifier for the user + action type (e.g. 'usr123:create_post')
 * @param maxActions Maximum actions allowed in the time window
 * @param windowMs Time window size in milliseconds
 */
export function checkRateLimit(
  actionKey: string,
  maxActions: number = 5,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetTimeMs: number } {
  const now = Date.now();
  if (!actionLog[actionKey]) {
    actionLog[actionKey] = { timestamps: [] };
  }

  const log = actionLog[actionKey];

  // Keep only timestamps within the current sliding window
  log.timestamps = log.timestamps.filter((t) => now - t < windowMs);

  if (log.timestamps.length >= maxActions) {
    const oldestTimestamp = log.timestamps[0];
    const resetTimeMs = oldestTimestamp + windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetTimeMs,
    };
  }

  // Allow action
  log.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxActions - log.timestamps.length,
    resetTimeMs: now + windowMs,
  };
}
