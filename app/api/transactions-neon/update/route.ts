import { type NextRequest, NextResponse } from "next/server"
import { inventorySql } from "@/lib/neon-connections"
import { requireModuleAccess, isModuleAccessError } from "@/lib/module-access"
import { normalizeTenantContext, runTenantQuery } from "@/lib/tenant-db"
import { recalculateInventoryForItem } from "@/lib/inventory-recalc"

export const dynamic = "force-dynamic"

export async function PUT(request: NextRequest) {
  try {
    console.log("[SERVER] 📥 PUT /api/transactions-neon/update")
    const sessionUser = await requireModuleAccess("transactions")
    const tenantContext = normalizeTenantContext(sessionUser.tenantId, sessionUser.role)
    const body = await request.json()
    console.log("[SERVER] Request body:", JSON.stringify(body, null, 2))

    const { id, item_type, quantity, transaction_type, notes, price } = body

    if (!id || !item_type || !quantity || !transaction_type) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: id, item_type, quantity, transaction_type",
        },
        { status: 400 },
      )
    }

    const existing = await runTenantQuery(
      inventorySql,
      tenantContext,
      inventorySql`
        SELECT id, item_type
        FROM transaction_history
        WHERE id = ${Number(id)}
          AND tenant_id = ${tenantContext.tenantId}
        LIMIT 1
      `,
    )

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found",
        },
        { status: 404 },
      )
    }

    // Normalize transaction type
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

    console.log("[SERVER] Updating transaction:", {
      id,
      item_type,
      quantity: quantityValue,
      transaction_type: normalizedType,
      price: priceValue,
      total_cost,
    })

    const result = await runTenantQuery(
      inventorySql,
      tenantContext,
      inventorySql`
        UPDATE transaction_history
        SET
          item_type = ${item_type},
          quantity = ${quantityValue},
          transaction_type = ${normalizedType},
          notes = ${notes || ""},
          price = ${priceValue},
          total_cost = ${total_cost},
          tenant_id = ${tenantContext.tenantId}
        WHERE id = ${Number(id)}
          AND tenant_id = ${tenantContext.tenantId}
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
      `,
    )

    const affectedItems = new Set<string>([String(existing[0]?.item_type)])
    affectedItems.add(String(item_type))
    for (const affectedItem of affectedItems) {
      if (!affectedItem) continue
      await recalculateInventoryForItem(inventorySql, tenantContext, affectedItem)
    }

    console.log("[SERVER] ✅ Transaction updated:", result[0])

    return NextResponse.json({
      success: true,
      transaction: result[0],
      message: "Transaction updated successfully",
    })
  } catch (error: any) {
    console.error("[SERVER] ❌ Error updating transaction:", error)
    if (isModuleAccessError(error)) {
      return NextResponse.json({ success: false, message: "Module access disabled" }, { status: 403 })
    }
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update transaction",
        error: error.toString(),
      },
      { status: 500 },
    )
  }
}
