import { NextResponse } from "next/server"
import { checkStorageStatus } from "@/lib/storage"
import { checkRedisConnection } from "@/lib/redis"

export async function GET() {
  try {
    // Check Redis connection
    const redisConnected = await checkRedisConnection()

    // Get storage status
    const status = await checkStorageStatus()

    // Get environment variable info (safely)
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

    return NextResponse.json({
      success: true,
      redis_connected: redisConnected,
      storage_status: status,
      environment: envInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Storage status error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error checking storage status",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
