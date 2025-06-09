// Test if NextResponse import is causing issues
export async function GET() {
  try {
    // Try importing NextResponse
    const { NextResponse } = await import("next/server")

    return NextResponse.json({
      status: "success",
      message: "NextResponse import working",
    })
  } catch (error) {
    // Fallback to basic Response if NextResponse fails
    return new Response(
      JSON.stringify({
        status: "error",
        message: "NextResponse import failed",
        error: String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
