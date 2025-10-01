import { NextResponse } from "next/server"
import { performBatchOperation } from "@/lib/neon-storage"

export async function POST(request: Request) {
  try {
    const { transactions } = await request.json()

    if (!Array.isArray(transactions)) {
      throw new Error("Invalid transactions data")
    }

    const success = await performBatchOperation(transactions)

    if (!success) {
      throw new Error("Failed to perform batch operation")
    }

    return NextResponse.json({
      success: true,
      message: "Batch operation completed successfully",
    })
  } catch (error) {
    console.error("Error in inventory-batch-neon POST:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform batch operation",
      },
      { status: 500 },
    )
  }
}
