import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Try to check if groq-sdk is available
    const packageCheck = await import("groq-sdk").then(
      () => ({ installed: true, error: null }),
      (err) => ({ installed: false, error: String(err) }),
    )

    return NextResponse.json({
      groqSdk: packageCheck,
      environment: {
        hasGroqKey: !!process.env.GROQ_API_KEY,
        keyLength: process.env.GROQ_API_KEY?.length || 0,
      },
      nodeVersion: process.version,
      platform: process.platform,
    })
  } catch (error) {
    return NextResponse.json({
      error: "Failed to check installation",
      details: String(error),
    })
  }
}
