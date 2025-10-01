import { type NextRequest, NextResponse } from "next/server"
import { inventorySql } from "@/lib/neon-connections"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("[SERVER] 📥 GET /api/transactions-neon")

    const { searchParams } = new URL(request.url)
    const itemType = searchParams.get("item_type")
    const limit = searchParams.get("limit")

    let query
    if (itemType) {
      query = await inventorySql`
        SELECT 
          th.id,
          th.item_type, 
          COALESCE(th.quantity, 0) as quantity,
          th.transaction_type, 
          th.notes, 
          th.transaction_date,
          th.user_id, 
          COALESCE(th.price, 0) as price, 
          COALESCE(th.total_cost, 0) as total_cost,
          COALESCE(ci.unit, 'kg') as unit
        FROM transaction_history th
        LEFT JOIN current_inventory ci ON th.item_type = ci.item_type
        WHERE th.item_type = ${itemType}
        ORDER BY th.transaction_date DESC
      `
    } else {
      const limitValue = limit ? Number.parseInt(limit) : 100
      query = await inventorySql`
        SELECT 
          th.id,
          th.item_type,
          th.quantity,
          th.transaction_type,
          th.notes,
          th.transaction_date,
          th.user_id,
          th.price,
          th.total_cost,
          COALESCE(ci.unit, 'kg') as unit
        FROM transaction_history th
        LEFT JOIN current_inventory ci ON th.item_type = ci.item_type
        ORDER BY th.transaction_date DESC
        LIMIT ${limitValue}
      `
    }

    const transactions = query.map((row) => ({
      id: Number(row.id),
      item_type: String(row.item_type),
      quantity: Number(row.quantity) || 0,
      transaction_type: String(row.transaction_type),
      notes: row.notes ? String(row.notes) : "",
      transaction_date: String(row.transaction_date),
      user_id: String(row.user_id),
      price: Number(row.price) || 0,
      total_cost: Number(row.total_cost) || 0,
      unit: String(row.unit || "kg"),
    }))

    console.log(`[SERVER] ✅ Returning ${transactions.length} transactions`)

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    })
  } catch (error: any) {
    console.error("[SERVER] ❌ Error fetching transactions:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch transactions",
        error: error.toString(),
        transactions: [],
        count: 0,
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[SERVER] 📥 POST /api/transactions-neon")
    const body = await request.json()
    console.log("[SERVER] Request body:", JSON.stringify(body, null, 2))

    const { item_type, quantity, transaction_type, notes, user_id, price } = body

    if (!item_type || !quantity || !transaction_type) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: item_type, quantity, transaction_type",
        },
        { status: 400 },
      )
    }

    // Normalize transaction_type
    let normalizedType = "deplete"
    const typeStr = String(transaction_type).toLowerCase()
    if (typeStr === "restocking" || typeStr === "restock") {
      normalizedType = "restock"
    } else if (typeStr === "depleting" || typeStr === "deplete") {
      normalizedType = "deplete"
    }

    const priceValue = Number(price) || 0
    const quantityValue = Number(quantity)
    const total_cost = quantityValue * priceValue

    console.log("[SERVER] Adding transaction:", {
      item_type,
      quantity: quantityValue,
      transaction_type: normalizedType,
      price: priceValue,
      total_cost,
    })

    // Just insert into transaction_history - don't touch current_inventory
    const result = await inventorySql`
      INSERT INTO transaction_history (
        item_type, 
        quantity, 
        transaction_type, 
        notes, 
        user_id, 
        price, 
        total_cost
      )
      VALUES (
        ${item_type},
        ${quantityValue},
        ${normalizedType},
        ${notes || ""},
        ${user_id || "system"},
        ${priceValue},
        ${total_cost}
      )
      RETURNING 
        id,
        item_type,
        quantity,
        transaction_type,
        notes,
        transaction_date,
        user_id,
        price,
        total_cost
    `

    console.log("[SERVER] ✅ Transaction added:", result[0])

    return NextResponse.json({
      success: true,
      transaction: result[0],
      message: "Transaction added successfully",
    })
  } catch (error: any) {
    console.error("[SERVER] ❌ Error adding transaction:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to add transaction",
        error: error.toString(),
      },
      { status: 500 },
    )
  }
}
