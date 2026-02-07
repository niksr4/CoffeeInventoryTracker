import { type NextRequest, NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"
import { requireModuleAccess, isModuleAccessError } from "@/lib/module-access"
import { normalizeTenantContext, runTenantQuery } from "@/lib/tenant-db"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 POST /api/transactions-neon/batch")
    const sessionUser = await requireModuleAccess("transactions")
    if (!["admin", "owner"].includes(sessionUser.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 })
    }
    const tenantContext = normalizeTenantContext(sessionUser.tenantId, sessionUser.role)
    const body = await request.json()
    const { transactions } = body

    if (!Array.isArray(transactions)) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Transactions must be an array" 
        },
        { status: 400 }
      )
    }

    console.log(`Processing ${transactions.length} transactions...`)

    // Delete all existing transactions and re-insert
    await runTenantQuery(
      accountsSql,
      tenantContext,
      accountsSql`
        DELETE FROM transaction_history
        WHERE tenant_id = ${tenantContext.tenantId}
      `,
    )
    
    // Insert all transactions
    for (const txn of transactions) {
      await runTenantQuery(
        accountsSql,
        tenantContext,
        accountsSql`
          INSERT INTO transaction_history (
            item_type, quantity, transaction_type, notes,
            transaction_date, user_id, price, total_cost,
            tenant_id
          )
          VALUES (
            ${txn.item_type},
            ${txn.quantity},
            ${txn.transaction_type},
            ${txn.notes || ""},
            ${txn.transaction_date || new Date().toISOString()},
            ${txn.user_id || "system"},
            ${txn.price || 0},
            ${txn.total_cost || 0},
            ${tenantContext.tenantId}
          )
        `,
      )
    }

    // Fetch updated transactions
    const updatedTransactions = await runTenantQuery(
      accountsSql,
      tenantContext,
      accountsSql`
        SELECT
          id,
          item_type,
          quantity,
          transaction_type,
          notes,
          transaction_date,
          user_id,
          price,
          total_cost
        FROM transaction_history
        WHERE tenant_id = ${tenantContext.tenantId}
        ORDER BY transaction_date DESC
        LIMIT 1000
      `,
    )

    return NextResponse.json({
      success: true,
      transactions: updatedTransactions,
      count: updatedTransactions.length,
    })
  } catch (error: any) {
    console.error("❌ Error in batch update:", error)
    if (isModuleAccessError(error)) {
      return NextResponse.json({ success: false, message: "Module access disabled" }, { status: 403 })
    }
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to batch update transactions",
        error: error?.toString() || String(error),
      },
      { status: 500 }
    )
  }
}
