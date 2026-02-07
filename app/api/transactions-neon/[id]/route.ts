import { type NextRequest, NextResponse } from "next/server"
import { inventorySql } from "@/lib/neon-connections"
import { requireModuleAccess, isModuleAccessError } from "@/lib/module-access"
import { normalizeTenantContext, runTenantQuery } from "@/lib/tenant-db"
import { recalculateInventoryForItem } from "@/lib/inventory-recalc"

export const dynamic = "force-dynamic"

export async function DELETE(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const sessionUser = await requireModuleAccess("transactions")
    if (!["admin", "owner"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }
    const tenantContext = normalizeTenantContext(sessionUser.tenantId, sessionUser.role)
    const id = Number(context.params.id)

    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, message: "Invalid transaction id" }, { status: 400 })
    }

    const existing = await runTenantQuery(
      inventorySql,
      tenantContext,
      inventorySql`
        SELECT id, item_type
        FROM transaction_history
        WHERE id = ${id}
          AND tenant_id = ${tenantContext.tenantId}
        LIMIT 1
      `,
    )

    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: false, message: "Transaction not found" }, { status: 404 })
    }

    await runTenantQuery(
      inventorySql,
      tenantContext,
      inventorySql`
        DELETE FROM transaction_history
        WHERE id = ${id}
          AND tenant_id = ${tenantContext.tenantId}
      `,
    )

    const itemType = String(existing[0]?.item_type || "")
    if (itemType) {
      await recalculateInventoryForItem(inventorySql, tenantContext, itemType)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[SERVER] ❌ Error deleting transaction:", error)
    if (isModuleAccessError(error)) {
      return NextResponse.json({ success: false, message: "Module access disabled" }, { status: 403 })
    }
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete transaction" },
      { status: 500 },
    )
  }
}
