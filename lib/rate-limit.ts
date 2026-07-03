/**
 * In-memory rate limiter using a sliding window.
 * Production-ready for single-instance deployments (Vercel serverless).
 * For multi-instance, swap to Redis/Upstash.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter(t => now - t < 60_000)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetInMs: number
}

/**
 * Check if a request is allowed under the rate limit.
 * @param identifier - Unique key (e.g., userId or IP)
 * @param maxRequests - Max requests allowed in the window
 * @param windowMs - Window size in milliseconds (default: 60s)
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 20,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(identifier) || { timestamps: [] }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    const resetInMs = oldestInWindow + windowMs - now

    return {
      allowed: false,
      remaining: 0,
      resetInMs,
    }
  }

  // Allow the request
  entry.timestamps.push(now)
  store.set(identifier, entry)

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetInMs: 0,
  }
}
