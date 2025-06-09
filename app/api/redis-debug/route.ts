import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Create a safe version of environment variables for debugging
    // that doesn't expose the full credentials
    const envDebug = {
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL
        ? `${process.env.UPSTASH_REDIS_REST_URL.substring(0, 10)}...`
        : "not set",
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN
        ? `${process.env.UPSTASH_REDIS_REST_TOKEN.substring(0, 5)}...`
        : "not set",
      NODE_ENV: process.env.NODE_ENV || "not set",
      VERCEL_ENV: process.env.VERCEL_ENV || "not set",
    }

    return NextResponse.json({
      success: true,
      message: "Environment debug information",
      environment: envDebug,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error retrieving debug information",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
