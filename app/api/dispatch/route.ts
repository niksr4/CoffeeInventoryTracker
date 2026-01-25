import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

// Connect to Dispatch database
function getDispatchDb() {
  const baseUrl = process.env.DATABASE_URL || ""
  // Replace database name with "Dispatch"
  const dispatchUrl = baseUrl.replace(/\/[^/?]+(\?|$)/, "/Dispatch$1")
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
        SELECT * FROM dispatch_records 
        WHERE dispatch_date >= ${startDate}::date 
        AND dispatch_date <= ${endDate}::date
        ORDER BY dispatch_date DESC, created_at DESC
      `
    } else {
      records = await sql`
        SELECT * FROM dispatch_records 
        ORDER BY dispatch_date DESC, created_at DESC
      `
    }

    return NextResponse.json({ success: true, records })
  } catch (error) {
    console.error("Error fetching dispatch records:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const sql = getDispatchDb()
    const body = await request.json()
    const { 
      dispatch_date, 
      estate, 
      coffee_type, 
      bag_type, 
      bags_dispatched, 
      price_per_bag, 
      buyer_name, 
      notes, 
      created_by 
    } = body

    if (!dispatch_date || !estate || !coffee_type || !bag_type || bags_dispatched === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO dispatch_records (
        dispatch_date, estate, coffee_type, bag_type, bags_dispatched, 
        price_per_bag, buyer_name, notes, created_by
      ) VALUES (
        ${dispatch_date}::date, ${estate}, ${coffee_type}, ${bag_type}, ${bags_dispatched},
        ${price_per_bag || null}, ${buyer_name || null}, ${notes || null}, ${created_by || 'unknown'}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, record: result[0] })
  } catch (error) {
    console.error("Error creating dispatch record:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const sql = getDispatchDb()
    const body = await request.json()
    const { id, price_per_bag, buyer_name, notes } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Record ID is required" },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE dispatch_records 
      SET 
        price_per_bag = ${price_per_bag || null},
        buyer_name = ${buyer_name || null},
        notes = ${notes || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, record: result[0] })
  } catch (error) {
    console.error("Error updating dispatch record:", error)
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

    await sql`DELETE FROM dispatch_records WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting dispatch record:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
