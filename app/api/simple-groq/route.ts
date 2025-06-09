import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Just try to import without using it
    await import("groq-sdk")

    return NextResponse.json({
      success: true,
      message: "groq-sdk can be imported",
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `Cannot import groq-sdk: ${error}`,
      errorType: typeof error,
      errorName: error instanceof Error ? error.name : "unknown",
      errorMessage: error instanceof Error ? error.message : String(error),
    })
  }
}
