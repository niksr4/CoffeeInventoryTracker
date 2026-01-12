import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const rainfallDbUrl = process.env.DATABASE_URL!.replace(/\/[^/]+$/, "/Rainfall")
const sql = neon(rainfallDbUrl)

export async function GET() {
  try {
    const records = await sql`
      SELECT * FROM rainfall_records 
      ORDER BY record_date DESC
    `
    return NextResponse.json({ success: true, records })
  } catch (error: any) {
    console.error("[v0] Error fetching rainfall records:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { record_date, inches, cents, notes, user_id } = await request.json()

    if (!record_date) {
      return NextResponse.json({ success: false, error: "Date is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO rainfall_records (record_date, inches, cents, notes, user_id)
      VALUES (${record_date}, ${inches || 0}, ${cents || 0}, ${notes || ""}, ${user_id || "unknown"})
      RETURNING *
    `

    return NextResponse.json({ success: true, record: result[0] })
  } catch (error: any) {
    console.error("[v0] Error saving rainfall record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM rainfall_records WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[v0] Error deleting rainfall record:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
