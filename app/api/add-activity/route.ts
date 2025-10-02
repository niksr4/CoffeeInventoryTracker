import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, reference } = body

    if (!code || !reference) {
      return NextResponse.json({ success: false, error: "Code and reference are required" }, { status: 400 })
    }

    // Check if code already exists
    const existingActivity = await accountsSql`
      SELECT code FROM account_activities WHERE code = ${code}
    `

    if (existingActivity.length > 0) {
      return NextResponse.json({ success: false, error: "Activity code already exists" }, { status: 400 })
    }

    // Insert new activity
    await accountsSql`
      INSERT INTO account_activities (code, activity)
      VALUES (${code}, ${reference})
    `

    return NextResponse.json({ success: true, message: "Activity added successfully" })
  } catch (error) {
    console.error("Error adding activity:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add activity",
      },
      { status: 500 },
    )
  }
}
