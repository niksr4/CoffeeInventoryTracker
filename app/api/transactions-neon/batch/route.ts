import { type NextRequest, NextResponse } from "next/server"
import { accountsSql } from "@/lib/neon-connections"
import { getTransactionHistory } from "@/lib/neon-inventory-storage"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 POST /api/transactions-neon/batch")
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
    await accountsSql`DELETE FROM transaction_history`
    
    // Insert all transactions
    for (const txn of transactions) {
      await accountsSql`
        INSERT INTO transaction_history (
          item_type, quantity, transaction_type, notes, 
          transaction_date, user_id, price, total_cost
        )
        VALUES (
          ${txn.item_type},
          ${txn.quantity},
          ${txn.transaction_type},
          ${txn.notes || ""},
          ${txn.transaction_date || new Date().toISOString()},
          ${txn.user_id || "system"},
          ${txn.price || 0},
          ${txn.total_cost || 0}
        )
      `
    }

    // Fetch updated transactions
    const updatedTransactions = await getTransactionHistory(1000)

    return NextResponse.json({
      success: true,
      transactions: updatedTransactions,
      count: updatedTransactions.length,
    })
  } catch (error: any) {
    console.error("❌ Error in batch update:", error)
    
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
