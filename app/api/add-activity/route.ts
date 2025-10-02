import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, reference } = body

    if (!code || !reference) {
      return NextResponse.json({ success: false, error: "Code and reference are required" }, { status: 400 })
    }

    // Check if code already exists
    const existingActivity = await sql`
      SELECT code FROM accounts_activity WHERE code = ${code}
    `

    if (existingActivity.length > 0) {
      return NextResponse.json({ success: false, error: "Activity code already exists" }, { status: 400 })
    }

    // Insert new activity
    await sql`
      INSERT INTO accounts_activity (code, activity)
      VALUES (${code}, ${reference})
    `

    return NextResponse.json({ success: true, message: "Activity added successfully" })
  } catch (error) {
    console.error("Error adding activity:", error)
    return NextResponse.json({ success: false, error: "Failed to add activity" }, { status: 500 })
  }
}
