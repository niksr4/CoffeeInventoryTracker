Skip to content
Nik's projects
Nik's projects

Hobby

v0-simple-inventory-tracker

4PMR1n5Vi



Source
Output
lib/redis.ts

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
}

// Check Redis connection and set availability flag
export async function checkRedisConnection(): Promise<boolean> {
  if (!redis) {
    isRedisAvailable = false
    return false
