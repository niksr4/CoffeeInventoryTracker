import { type NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET(request: NextRequest) {
  if (!redis) {
    return NextResponse.json({ error: "Redis client not initialized" }, { status: 500 })
  }

  try {
    const ping = await redis.ping()
    return NextResponse.json({ result: ping })
  } catch (error) {
    console.error("Redis Simple Test API error:", error)
    return NextResponse.json({ error: "Failed to ping Redis" }, { status: 500 })
  }
}
