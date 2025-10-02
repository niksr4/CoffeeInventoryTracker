import { NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"

export async function GET() {
  try {
    console.log("📡 Fetching all activity codes from accounts_db...")

    const result = await accountsSql`
      SELECT code, activity as reference
      FROM account_activities
      ORDER BY code ASC
    `

    console.log(`✅ Found ${result.length} activity codes`)

    return NextResponse.json({
      success: true,
      activities: result,
    })
  } catch (error: any) {
    console.error("❌ Error fetching activity codes:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        activities: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, activity } = body

    console.log("➕ Adding new activity:", { code, activity })

    // Check if code already exists
    const existing = await accountsSql`
      SELECT code FROM account_activities WHERE code = ${code}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Activity code already exists",
        },
        { status: 400 },
      )
    }

    await accountsSql`
      INSERT INTO account_activities (code, activity)
      VALUES (${code}, ${activity})
    `

    console.log("✅ Activity added successfully")

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error("❌ Error adding activity:", error.message)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
