import { Redis } from "@upstash/redis"

// Simple flag to track if Redis is available
let isRedisAvailable = false

// Create the Redis client with a simpler approach
let redisClient: Redis | null = null

try {
  // Only create the client if environment variables are available
  if (
    typeof process.env.UPSTASH_REDIS_REST_URL === "string" &&
    typeof process.env.UPSTASH_REDIS_REST_TOKEN === "string"
  ) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })

    // We'll set this to true after we confirm connection works
    console.log("Redis client initialized")
  } else {
    console.warn("Redis environment variables missing")
    redisClient = null
  }
} catch (error) {
  console.error("Failed to initialize Redis client:", error)
  redisClient = null
}

// Export the client
export const redis = redisClient

// Key constants for Redis
export const KEYS = {
  TRANSACTIONS: "inventory:transactions",
  INVENTORY_HASH: "inventory:items",
  LAST_UPDATE: "inventory:lastUpdate",
  LABOR_DEPLOYMENTS: "labor:deployments",
}

// Check Redis connection and set availability flag
export async function checkRedisConnection(): Promise<boolean> {
  if (!redis) {
    isRedisAvailable = false
    return false
  }

  try {
    const pong = await redis.ping()
    isRedisAvailable = pong === "PONG"
    console.log("Redis connection check:", isRedisAvailable ? "Connected" : "Failed")
    return isRedisAvailable
  } catch (error) {
    console.error("Redis connection error:", error)
    isRedisAvailable = false
    return false
  }
}

// Get Redis availability status
export function getRedisAvailability(): boolean {
  return isRedisAvailable
}

// Set Redis availability status
export function setRedisAvailability(status: boolean): void {
  isRedisAvailable = status
}

// Safe Redis Operation
export async function safeRedisOperation<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  if (!redis) {
    console.warn("Redis client not initialized, operation skipped")
    return fallback
  }

  try {
    return await operation()
  } catch (error) {
    console.error("Redis operation failed:", error)
    return fallback
  }
}
