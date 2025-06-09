import { NextResponse } from "next/server"

export async function GET() {
  try {
    const packageChecks = []

    // Check for groq-sdk
    try {
      await import("groq-sdk")
      packageChecks.push({ package: "groq-sdk", status: "✅ Available" })
    } catch (error) {
      packageChecks.push({
        package: "groq-sdk",
        status: "❌ Not found",
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Check environment variables
    const envVars = {
      GROQ_API_KEY: process.env.GROQ_API_KEY ? `Present (${process.env.GROQ_API_KEY.length} chars)` : "❌ Missing",
    }

    return NextResponse.json({
      success: true,
      packageChecks,
      envVars,
      nodeVersion: process.version,
      platform: process.platform,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
