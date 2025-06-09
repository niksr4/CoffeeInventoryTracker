import { NextResponse } from "next/server"
import { forceInitializeData } from "@/lib/storage"

export async function POST() {
  try {
    console.log("=== Force initialization called ===")

    const success = await forceInitializeData()

    if (success) {
      return NextResponse.json({
        success: true,
        message: "Data forcefully initialized with default transactions",
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Failed to initialize data",
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Force init error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
