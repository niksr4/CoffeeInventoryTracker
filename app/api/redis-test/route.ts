import { type NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET(request: NextRequest) {
  if (!redis) {
    return NextResponse.json({ error: "Redis client not initialized" }, { status: 500 })
  }

  try {
    const testKey = "testKey"
    const testValue = "testValue"

    // Set a key
    await redis.set(testKey, testValue)

    // Get the key
    const retrievedValue = await redis.get(testKey)

    // Check if the value is correct
    if (retrievedValue === testValue) {
      return NextResponse.json({ result: "Redis test successful!" })
    } else {
      return NextResponse.json({ error: "Redis test failed: incorrect value" }, { status: 500 })
    }
  } catch (error) {
    console.error("Redis Test API error:", error)
    return NextResponse.json({ error: "Failed to connect to Redis" }, { status: 500 })
  }
}
