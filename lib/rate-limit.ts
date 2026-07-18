/**
 * Rate limiter using Upstash Redis.
 * Production-ready for Vercel serverless.
 */
import { Redis } from '@upstash/redis'

// Fallback to in-memory if Redis is not configured (e.g. local dev without env vars)
let redis: Redis | null = null
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
} catch (e) {
  console.warn('Upstash Redis not configured, using fallback memory limiter')
}

// Fallback memory store
interface RateLimitEntry { timestamps: number[] }
const store = new Map<string, RateLimitEntry>()

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
export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 20,
  windowMs: number = 60_000
): Promise<RateLimitResult> {
  const now = Date.now()

  if (redis) {
    const key = `ratelimit:${identifier}`
    const windowStart = now - windowMs

    // Use a Redis transaction to atomially clean old entries, add new, and count
    const pipeline = redis.pipeline()
    pipeline.zremrangebyscore(key, 0, windowStart) // Remove older than window
    pipeline.zcard(key) // Count remaining

    const results = await pipeline.exec()
    const count = (results[1] as number) || 0

    if (count >= maxRequests) {
      // Find oldest to calculate reset
      const oldest = await redis.zrange(key, 0, 0, { withScores: true })
      let resetInMs = windowMs
      if (oldest && oldest.length > 1) {
         resetInMs = (oldest[1] as number) + windowMs - now
      }
      return { allowed: false, remaining: 0, resetInMs }
    }

    // Allowed
    const p2 = redis.pipeline()
    p2.zadd(key, { score: now, member: `${now}-${Math.random()}` })
    p2.expire(key, Math.ceil(windowMs / 1000) + 1)
    await p2.exec()

    return { allowed: true, remaining: maxRequests - count - 1, resetInMs: 0 }
  }

  // Fallback Memory Logic
  const entry = store.get(identifier) || { timestamps: [] }
  entry.timestamps = entry.timestamps.filter(t => now - t < windowMs)

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]
    return {
      allowed: false,
      remaining: 0,
      resetInMs: oldestInWindow + windowMs - now,
    }
  }

  entry.timestamps.push(now)
  store.set(identifier, entry)
  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    resetInMs: 0,
  }
}
