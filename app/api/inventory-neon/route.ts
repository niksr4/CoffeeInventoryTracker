import { type NextRequest, NextResponse } from "next/server"
import { inventorySql } from "@/lib/neon-connections"
import { requireModuleAccess, isModuleAccessError } from "@/lib/module-access"
import { normalizeTenantContext, runTenantQueries, runTenantQuery } from "@/lib/tenant-db"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    console.log("[SERVER] 📥 GET /api/inventory-neon")
    const sessionUser = await requireModuleAccess("inventory")
    const tenantContext = normalizeTenantContext(sessionUser.tenantId, sessionUser.role)
    const [inventory, summary] = await runTenantQueries(inventorySql, tenantContext, [
      inventorySql`
        SELECT 
          item_type,
          COALESCE(unit, 'kg') as unit,
          COALESCE(SUM(quantity), 0) as quantity,
          COALESCE(SUM(total_cost), 0) as total_cost,
          CASE
            WHEN COALESCE(SUM(quantity), 0) > 0 THEN COALESCE(SUM(total_cost), 0) / COALESCE(SUM(quantity), 0)
            ELSE 0
          END as avg_price
        FROM current_inventory
        WHERE tenant_id = ${tenantContext.tenantId}
        GROUP BY item_type, unit
        ORDER BY item_type
      `,
      inventorySql`
        SELECT 
          COALESCE(SUM(total_cost), 0) as total_inventory_value,
          COUNT(DISTINCT item_type) as total_items,
          COALESCE(SUM(quantity), 0) as total_quantity
        FROM current_inventory
        WHERE tenant_id = ${tenantContext.tenantId}
      `,
    ])

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
    if (isModuleAccessError(error)) {
      return NextResponse.json({ success: false, message: "Module access disabled" }, { status: 403 })
    }
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
    const sessionUser = await requireModuleAccess("inventory")
    if (!["admin", "owner"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, message: "Admin role required" }, { status: 403 })
    }
    const tenantContext = normalizeTenantContext(sessionUser.tenantId, sessionUser.role)
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

    // Ensure the item exists with the correct unit without double-counting inventory.
    // The transaction_history trigger will update quantity/total_cost when we insert a restock transaction.
    await runTenantQuery(
      inventorySql,
      tenantContext,
      inventorySql`
        INSERT INTO current_inventory (item_type, quantity, unit, avg_price, total_cost, tenant_id)
        VALUES (
          ${item_type},
          0,
          ${unit},
          0,
          0,
          ${tenantContext.tenantId}
        )
        ON CONFLICT (item_type, tenant_id)
        DO UPDATE SET
          unit = EXCLUDED.unit
      `,
    )

    console.log("[SERVER] ✅ Item ensured in current_inventory")

    // Add initial transaction if quantity > 0 (trigger updates current_inventory)
    if (quantityValue > 0) {
      await runTenantQuery(
        inventorySql,
        tenantContext,
        inventorySql`
          INSERT INTO transaction_history (
            item_type,
            quantity,
            transaction_type,
            notes,
            user_id,
            price,
            total_cost,
            tenant_id
          )
          VALUES (
            ${item_type},
            ${quantityValue},
            'restock',
            ${notes || `New item added: ${item_type}`},
            ${user_id || "system"},
            ${priceValue},
            ${total_cost},
            ${tenantContext.tenantId}
          )
        `,
      )
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
    if (isModuleAccessError(error)) {
      return NextResponse.json({ success: false, message: "Module access disabled" }, { status: 403 })
    }
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

export async function PUT(request: NextRequest) {
  try {
    console.log("[SERVER] 📥 PUT /api/inventory-neon - Update Item")
    const sessionUser = await requireModuleAccess("inventory")
    if (!["admin", "owner"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }
    const tenantContext = normalizeTenantContext(sessionUser.tenantId, sessionUser.role)
    const body = await request.json()
    console.log("[SERVER] Request body:", JSON.stringify(body, null, 2))

    const { item_type, new_item_type, unit } = body

    if (!item_type) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required field: item_type",
        },
        { status: 400 },
      )
    }

    const resolvedName = String(new_item_type || item_type).trim()
    if (!resolvedName) {
      return NextResponse.json(
        {
          success: false,
          message: "Item name cannot be empty",
        },
        { status: 400 },
      )
    }

    const existing = await runTenantQuery(
      inventorySql,
      tenantContext,
      inventorySql`
        SELECT item_type, quantity, unit, avg_price, total_cost
        FROM current_inventory
        WHERE item_type = ${item_type}
          AND tenant_id = ${tenantContext.tenantId}
        LIMIT 1
      `,
    )

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Inventory item not found",
        },
        { status: 404 },
      )
    }

    if (resolvedName !== item_type) {
      const nameCollision = await runTenantQuery(
        inventorySql,
        tenantContext,
        inventorySql`
          SELECT 1
          FROM current_inventory
          WHERE item_type = ${resolvedName}
            AND tenant_id = ${tenantContext.tenantId}
          LIMIT 1
        `,
      )
      if (nameCollision?.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Another inventory item already uses that name",
          },
          { status: 409 },
        )
      }
    }

    const resolvedUnit = String(unit || existing[0]?.unit || "kg").trim() || "kg"

    const result = await runTenantQuery(
      inventorySql,
      tenantContext,
      inventorySql`
        UPDATE current_inventory
        SET
          item_type = ${resolvedName},
          unit = ${resolvedUnit},
          tenant_id = ${tenantContext.tenantId}
        WHERE item_type = ${item_type}
          AND tenant_id = ${tenantContext.tenantId}
        RETURNING item_type, quantity, unit, avg_price, total_cost
      `,
    )

    if (resolvedName !== item_type) {
      await runTenantQuery(
        inventorySql,
        tenantContext,
        inventorySql`
          UPDATE transaction_history
          SET item_type = ${resolvedName}
          WHERE item_type = ${item_type}
            AND tenant_id = ${tenantContext.tenantId}
        `,
      )
    }

    return NextResponse.json({
      success: true,
      item: {
        name: result?.[0]?.item_type || resolvedName,
        quantity: Number(result?.[0]?.quantity) || 0,
        unit: String(result?.[0]?.unit || resolvedUnit),
        avg_price: result?.[0]?.avg_price ? Number(result[0].avg_price) : undefined,
        total_cost: result?.[0]?.total_cost ? Number(result[0].total_cost) : undefined,
      },
    })
  } catch (error: any) {
    console.error("[SERVER] ❌ Error updating inventory item:", error)
    if (isModuleAccessError(error)) {
      return NextResponse.json({ success: false, message: "Module access disabled" }, { status: 403 })
    }
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update item",
        error: error.toString(),
      },
      { status: 500 },
    )
  }
}
