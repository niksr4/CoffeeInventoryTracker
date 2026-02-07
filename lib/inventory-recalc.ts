import type { NeonQueryFunction } from "@neondatabase/serverless"
import { runTenantQuery } from "@/lib/tenant-db"

type TenantContext = {
  tenantId: string
  role: string
}

const isRestockType = (value: string) => {
  const normalized = value.toLowerCase()
  return normalized === "restock" || normalized === "restocking"
}

export async function recalculateInventoryForItem(
  sql: NeonQueryFunction<boolean, boolean>,
  tenantContext: TenantContext,
  itemType: string,
) {
  const transactions = await runTenantQuery(
    sql,
    tenantContext,
    sql`
      SELECT transaction_type, quantity, total_cost
      FROM transaction_history
      WHERE item_type = ${itemType}
        AND tenant_id = ${tenantContext.tenantId}
      ORDER BY transaction_date ASC, id ASC
    `,
  )

  let runningQty = 0
  let runningCost = 0

  for (const row of transactions || []) {
    const qty = Number(row.quantity) || 0
    const totalCost = Number(row.total_cost) || 0
    const type = String(row.transaction_type || "")

    if (isRestockType(type)) {
      runningQty += qty
      runningCost += totalCost
      continue
    }

    const avgCost = runningQty > 0 ? runningCost / runningQty : 0
    const depletionCost = avgCost * qty
    runningQty = Math.max(0, runningQty - qty)
    runningCost = Math.max(0, runningCost - depletionCost)
  }

  const avgPrice = runningQty > 0 ? runningCost / runningQty : 0
  const unitRow = await runTenantQuery(
    sql,
    tenantContext,
    sql`
      SELECT unit
      FROM current_inventory
      WHERE item_type = ${itemType}
        AND tenant_id = ${tenantContext.tenantId}
      LIMIT 1
    `,
  )
  const unit = unitRow?.[0]?.unit ? String(unitRow[0].unit) : "kg"

  await runTenantQuery(
    sql,
    tenantContext,
    sql`
      INSERT INTO current_inventory (item_type, quantity, unit, avg_price, total_cost, tenant_id)
      VALUES (${itemType}, ${runningQty}, ${unit}, ${avgPrice}, ${runningCost}, ${tenantContext.tenantId})
      ON CONFLICT (item_type, tenant_id)
      DO UPDATE SET
        quantity = ${runningQty},
        unit = ${unit},
        avg_price = ${avgPrice},
        total_cost = ${runningCost}
    `,
  )

  return {
    quantity: runningQty,
    total_cost: runningCost,
    avg_price: avgPrice,
    unit,
  }
}
