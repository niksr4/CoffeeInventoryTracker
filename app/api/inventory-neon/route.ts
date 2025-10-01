import { type NextRequest, NextResponse } from "next/server"
import { inventorySql } from "@/lib/neon-connections"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("[SERVER] 📥 GET /api/inventory-neon")

    const inventory = await inventorySql`
      SELECT 
        item_type,
        quantity,
        unit,
        avg_price,
        total_cost
      FROM current_inventory
      ORDER BY item_type
    `

    const summary = await inventorySql`
      SELECT 
        COALESCE(SUM(total_cost), 0) as total_inventory_value,
        COUNT(*) as total_items,
        COALESCE(SUM(quantity), 0) as total_quantity
      FROM current_inventory
    `

    const transformedInventory = inventory.map((item) => ({
      name: String(item.item_type),
      quantity: Number(item.quantity) || 0,
      unit: String(item.unit || "kg"),
      avg_price: item.avg_price ? Number(item.avg_price) : undefined,
      total_cost: item.total_cost ? Number(item.total_cost) : undefined,
    }))

    console.log(`[SERVER] ✅ Returning ${transformedInventory.length} inventory items`)

    return NextResponse.json({
      success: true,
      inventory: transformedInventory,
      summary: {
        total_inventory_value: Number(summary[0]?.total_inventory_value) || 0,
        total_items: Number(summary[0]?.total_items) || 0,
        total_quantity: Number(summary[0]?.total_quantity) || 0,
      },
    })
  } catch (error: any) {
    console.error("[SERVER] ❌ Error fetching inventory:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch inventory",
        error: error.toString(),
        inventory: [],
        summary: {
          total_inventory_value: 0,
          total_items: 0,
          total_quantity: 0,
        },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[SERVER] 📥 POST /api/inventory-neon - Add New Item")
    const body = await request.json()
    console.log("[SERVER] Request body:", JSON.stringify(body, null, 2))

    const { item_type, quantity, unit, price, user_id, notes } = body

    if (!item_type || !unit) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: item_type, unit",
        },
        { status: 400 },
      )
    }

    const quantityValue = Number(quantity) || 0
    const priceValue = Number(price) || 0
    const total_cost = quantityValue * priceValue
    const avg_price = quantityValue > 0 ? total_cost / quantityValue : 0

    console.log("[SERVER] Creating new inventory item:", {
      item_type,
      quantity: quantityValue,
      unit,
      avg_price,
      total_cost,
    })

    // Step 1: Insert into current_inventory
    await inventorySql`
      INSERT INTO current_inventory (item_type, quantity, unit, avg_price, total_cost)
      VALUES (
        ${item_type},
        ${quantityValue},
        ${unit},
        ${avg_price},
        ${total_cost}
      )
    `

    console.log("[SERVER] ✅ Item added to current_inventory")

    // Step 2: Add initial transaction if quantity > 0
    if (quantityValue > 0) {
      await inventorySql`
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
          'restock',
          ${notes || `New item added: ${item_type}`},
          ${user_id || "system"},
          ${priceValue},
          ${total_cost}
        )
      `
      console.log("[SERVER] ✅ Initial transaction recorded")
    }

    return NextResponse.json({
      success: true,
      message: "Item added successfully",
      item: {
        name: item_type,
        quantity: quantityValue,
        unit,
        avg_price,
        total_cost,
      },
    })
  } catch (error: any) {
    console.error("[SERVER] ❌ Error adding item:", error)
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to add item",
        error: error.toString(),
      },
      { status: 500 },
    )
  }
}
