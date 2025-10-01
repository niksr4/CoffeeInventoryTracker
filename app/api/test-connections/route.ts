import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { testNeonConnection } from "@/lib/neon"

export async function GET() {
  try {
    // Test Redis
    let redisConnected = false
    try {
      if (redis) {
        await redis.ping()
        redisConnected = true
      }
    } catch (error) {
      console.error("Redis test failed:", error)
    }

    // Test Neon
    const neonConnected = await testNeonConnection()

    return NextResponse.json({
      success: redisConnected || neonConnected,
      redis: redisConnected,
      neon: neonConnected,
      message: `Redis: ${redisConnected ? "✅" : "❌"}, Neon: ${neonConnected ? "✅" : "❌"}`,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        redis: false,
        neon: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
