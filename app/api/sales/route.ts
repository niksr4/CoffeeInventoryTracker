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
      batch_no,
      estate,
      bags_sent,
      kgs,
      kgs_received,
      bags_sold,
      price_per_bag,
      revenue,
      bank_account, 
      notes 
    } = body

    if (!sale_date || bags_sold === undefined || price_per_bag === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Calculate price per kg (price_per_bag / 50)
    const price_per_kg = price_per_bag / 50
    const weight_kgs = kgs_received || (bags_sold * 50)

    const result = await sql`
      INSERT INTO sales_records (
        sale_date, coffee_type, bag_type, batch_no, estate, bags_sent, kgs, kgs_received, bags_sold, price_per_bag, revenue, bank_account, notes, weight_kgs, price_per_kg, total_revenue
      ) VALUES (
        ${sale_date}::date, ${coffee_type || null}, ${bag_type || null}, ${batch_no || null}, ${estate || null}, ${bags_sent || 0}, ${kgs || 0}, ${kgs_received || 0}, ${bags_sold}, ${price_per_bag}, ${revenue}, ${bank_account || null}, ${notes || null}, ${weight_kgs}, ${price_per_kg}, ${revenue}
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

export async function PUT(request: Request) {
  try {
    const sql = getDispatchDb()
    const body = await request.json()
    const { 
      id,
      sale_date,
      coffee_type,
      bag_type,
      batch_no,
      estate,
      bags_sent,
      kgs,
      kgs_received,
      bags_sold,
      price_per_bag,
      revenue,
      bank_account, 
      notes 
    } = body

    if (!id || !sale_date || bags_sold === undefined || price_per_bag === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Calculate price per kg (price_per_bag / 50)
    const price_per_kg = price_per_bag / 50
    const weight_kgs = kgs_received || (bags_sold * 50)

    const result = await sql`
      UPDATE sales_records SET
        sale_date = ${sale_date}::date,
        coffee_type = ${coffee_type || null},
        bag_type = ${bag_type || null},
        batch_no = ${batch_no || null},
        estate = ${estate || null},
        bags_sent = ${bags_sent || 0},
        kgs = ${kgs || 0},
        kgs_received = ${kgs_received || 0},
        bags_sold = ${bags_sold},
        price_per_bag = ${price_per_bag},
        revenue = ${revenue},
        bank_account = ${bank_account || null},
        notes = ${notes || null},
        weight_kgs = ${weight_kgs},
        price_per_kg = ${price_per_kg},
        total_revenue = ${revenue},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json({ success: true, record: result[0] })
  } catch (error) {
    console.error("Error updating sales record:", error)
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
