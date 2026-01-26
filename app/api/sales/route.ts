import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

// Connect to dispatch database (sales table will be in same db)
function getDispatchDb() {
  const baseUrl = process.env.DATABASE_URL || ""
  const dispatchUrl = baseUrl.replace(/\/[^/?]+(\?|$)/, "/dispatch$1")
  return neon(dispatchUrl)
}

export async function GET(request: Request) {
  try {
    const sql = getDispatchDb()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    let records
    if (startDate && endDate) {
      records = await sql`
        SELECT * FROM sales_records 
        WHERE sale_date >= ${startDate}::date 
        AND sale_date <= ${endDate}::date
        ORDER BY sale_date DESC, created_at DESC
      `
    } else {
      records = await sql`
        SELECT * FROM sales_records 
        ORDER BY sale_date DESC, created_at DESC
      `
    }

    return NextResponse.json({ success: true, records })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    if (errorMessage.includes("does not exist")) {
      console.log("Sales table not set up yet")
      return NextResponse.json({ success: true, records: [] })
    }
    console.error("Error fetching sales records:", error)
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDispatchDb()
    const body = await request.json()
    const { 
      sale_date, 
      coffee_type, 
      bag_type, 
      weight_kgs,
      price_per_kg,
      buyer_name, 
      notes 
    } = body

    if (!sale_date || !coffee_type || !bag_type || weight_kgs === undefined || price_per_kg === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const total_revenue = Number(weight_kgs) * Number(price_per_kg)

    const result = await sql`
      INSERT INTO sales_records (
        sale_date, coffee_type, bag_type, weight_kgs, price_per_kg, total_revenue, buyer_name, notes
      ) VALUES (
        ${sale_date}::date, ${coffee_type}, ${bag_type}, ${weight_kgs}, ${price_per_kg}, ${total_revenue}, ${buyer_name || null}, ${notes || null}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, record: result[0] })
  } catch (error) {
    console.error("Error creating sales record:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const sql = getDispatchDb()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Record ID is required" },
        { status: 400 }
      )
    }

    await sql`DELETE FROM sales_records WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sales record:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
