import { NextResponse } from "next/server"
import { redis, checkRedisConnection, safeRedisOperation } from "@/lib/redis"

export async function GET() {
  // Prepare environment variable debug info
  const envInfo = {
    UPSTASH_REDIS_REST_URL: {
      exists: !!process.env.UPSTASH_REDIS_REST_URL,
      length: process.env.UPSTASH_REDIS_REST_URL?.length || 0,
    },
    UPSTASH_REDIS_REST_TOKEN: {
      exists: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      length: process.env.UPSTASH_REDIS_REST_TOKEN?.length || 0,
    },
    NODE_ENV: process.env.NODE_ENV || "not set",
    VERCEL_ENV: process.env.VERCEL_ENV || "not set",
  }

  // Check if Redis client is initialized
  const clientInitialized = !!redis

  try {
    // Check Redis connection
    const isConnected = await checkRedisConnection()

    // Try a simple Redis operation with safe wrapper
    const testResult = await safeRedisOperation(async () => {
      const testKey = "test:connection"
      await redis!.set(testKey, "Connection successful!")
      return redis!.get(testKey)
    }, "Operation skipped - Redis not available")

    // Return the results
    return NextResponse.json({
      success: isConnected,
      message: isConnected ? "Redis connection successful" : "Redis connection failed",
      client_initialized: clientInitialized,
      test_result: testResult,
      env_info: envInfo,
    })
  } catch (error) {
    // Capture error details
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error",
      name: error instanceof Error ? error.name : "N/A",
      stack: error instanceof Error ? error.stack : "N/A",
      toString: String(error),
    }

    // Log the error
    console.error("Redis test error:", errorDetails)

    // Return error information
    return NextResponse.json({
      success: false,
      message: "Error testing Redis connection",
      client_initialized: clientInitialized,
      error_details: errorDetails,
      env_info: envInfo,
    })
  }
}
