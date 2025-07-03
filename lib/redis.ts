import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

// Key constants for Redis
export const KEYS = {
  /* ── Inventory & transactions (legacy names – DO NOT REMOVE) ────────────── */
  TRANSACTIONS: "inventory:transactions",
  INVENTORY_HASH: "inventory:items",
  LAST_UPDATE: "inventory:lastUpdate",

  /* ── Labor deployments (already existed) ────────────────────────────────── */
  LABOR_DEPLOYMENTS: "labor:deployments",

  /* ── NEW keys introduced in last refactor – keep for future use ─────────── */
  INVENTORY_ITEMS: "data:inventory_items",
  INVENTORY_TRANSACTIONS: "data:inventory_transactions",
  CONSUMABLE_DEPLOYMENTS: "data:consumable_deployments",
}

let redis: Redis | null = null
let ratelimit: Ratelimit | null = null
let isRedisAvailable = false

async function checkRedisConnection() {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REDIS_REST_URL === "YOUR_URL_HERE"
  ) {
    console.warn("Redis environment variables are not set. Skipping Redis initialization.")
    isRedisAvailable = false
    return
  }

  try {
    if (!redis) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    }

    // Test connection
    await redis.ping()
    isRedisAvailable = true
    console.log("Successfully connected to Redis.")

    if (!ratelimit) {
      ratelimit = new Ratelimit({
        redis: redis,
        limiter: Ratelimit.slidingWindow(10, "10 s"),
        analytics: true,
        prefix: "@upstash/ratelimit",
      })
    }
  } catch (error) {
    console.error("Failed to connect to Redis:", error)
    isRedisAvailable = false
    redis = null
    ratelimit = null
  }
}

// Initial check
checkRedisConnection()

export function getRedisAvailability() {
  return isRedisAvailable
}

export function setRedisAvailability(status: boolean) {
  isRedisAvailable = status
  if (!status) {
    redis = null
    ratelimit = null
  }
}

/**
 * Safely run a Redis operation.
 * If Redis is not available (e.g., missing env vars or connection failed) the
 * function short-circuits and returns `null`, so callers don’t have to repeat
 * the same guard logic everywhere.
 *
 * Example:
 *   const value = await safeRedisOperation(r => r.get("some:key"))
 */
export async function safeRedisOperation<T>(operation: (client: Redis) => Promise<T>): Promise<T | null> {
  if (!isRedisAvailable || !redis) {
    // Redis is disabled or unreachable – fail silently.
    return null
  }

  try {
    return await operation(redis)
  } catch (error) {
    console.error("safeRedisOperation → Redis command failed:", error)
    return null
  }
}

export { redis, ratelimit, checkRedisConnection }
