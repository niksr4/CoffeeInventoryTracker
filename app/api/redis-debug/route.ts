import { type NextRequest, NextResponse } from "next/server"
import { redis, KEYS } from "@/lib/redis"

export async function GET(request: NextRequest) {
  if (!redis) {
    return NextResponse.json({ error: "Redis client not initialized" }, { status: 500 })
  }

  try {
    const keys = Object.values(KEYS)
    const data: Record<string, any> = {}

    for (const key of keys) {
      try {
        const value = await redis.get(key)
        data[key] = value
      } catch (error) {
        data[key] = `Error fetching: ${error}`
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Redis Debug API error:", error)
    return NextResponse.json({ error: "Failed to fetch data from Redis" }, { status: 500 })
  }
}
