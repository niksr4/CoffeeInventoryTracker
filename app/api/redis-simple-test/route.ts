import { NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

export async function GET() {
  // Direct response for debugging
  const debugInfo = {
    url_available: typeof process.env.UPSTASH_REDIS_REST_URL === "string",
    token_available: typeof process.env.UPSTASH_REDIS_REST_TOKEN === "string",
    url_length: process.env.UPSTASH_REDIS_REST_URL?.length || 0,
    token_length: process.env.UPSTASH_REDIS_REST_TOKEN?.length || 0,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
  }

  try {
    // Create a new Redis client directly in this function
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || "",
      token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
    })

    // Try a simple ping operation
    const pingResult = await redis.ping()

    // If we get here, the connection was successful
    return NextResponse.json({
      success: true,
      message: "Redis connection successful",
      ping_result: pingResult,
      debug_info: debugInfo,
    })
  } catch (error) {
    // Capture the full error details
    const errorDetails = {
      message: error instanceof Error ? error.message : "Unknown error object",
      name: error instanceof Error ? error.name : "N/A",
      stack: error instanceof Error ? error.stack : "N/A",
      toString: String(error),
    }

    // Log the error for server-side debugging
    console.error("Redis test error:", JSON.stringify(errorDetails, null, 2))

    // Return detailed error information
    return NextResponse.json({
      success: false,
      message: "Redis connection failed",
      error_details: errorDetails,
      debug_info: debugInfo,
    })
  }
}
