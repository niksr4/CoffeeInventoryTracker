import { NextResponse } from "next/server"
import { inventorySql } from "@/lib/neon-connections"

export const dynamic = "force-dynamic"

export async function POST() {
  try {
    console.log("[SERVER] 🔧 Fixing inventory trigger...")

    // Drop existing trigger and function with CASCADE
    await inventorySql`
      DROP TRIGGER IF EXISTS trigger_update_inventory ON transaction_history CASCADE
    `
    console.log("[SERVER] ✅ Dropped trigger")

    await inventorySql`
      DROP FUNCTION IF EXISTS update_inventory() CASCADE
    `
    console.log("[SERVER] ✅ Dropped function")

    // Create the improved trigger function with UPSERT
    await inventorySql`
      CREATE OR REPLACE FUNCTION update_inventory()
      RETURNS TRIGGER AS $$
      BEGIN
          INSERT INTO current_inventory (item_type, quantity, total_cost, avg_price, unit)
          VALUES (
              NEW.item_type,
              CASE 
                  WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.quantity 
                  ELSE -NEW.quantity 
              END,
              CASE 
                  WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.total_cost 
                  ELSE 0 
              END,
              CASE 
                  WHEN NEW.transaction_type IN ('Restocking', 'restock') AND NEW.quantity > 0 
                  THEN NEW.total_cost / NEW.quantity 
                  ELSE 0 
              END,
              COALESCE((SELECT unit FROM current_inventory WHERE item_type = NEW.item_type), 'kg')
          )
          ON CONFLICT (item_type) 
          DO UPDATE SET
              quantity = current_inventory.quantity + 
                  CASE 
                      WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.quantity 
                      ELSE -NEW.quantity 
                  END,
              total_cost = CASE
                  WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN
                      current_inventory.total_cost + NEW.total_cost
                  ELSE
                      GREATEST(0, current_inventory.total_cost - (
                          CASE 
                              WHEN current_inventory.quantity > 0 
                              THEN (current_inventory.total_cost / current_inventory.quantity) * NEW.quantity
                              ELSE 0
                          END
                      ))
              END,
              avg_price = CASE
                  WHEN (current_inventory.quantity + 
                      CASE 
                          WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.quantity 
                          ELSE -NEW.quantity 
                      END) > 0
                  THEN (
                      CASE
                          WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN
                              current_inventory.total_cost + NEW.total_cost
                          ELSE
                              GREATEST(0, current_inventory.total_cost - (
                                  CASE 
                                      WHEN current_inventory.quantity > 0 
                                      THEN (current_inventory.total_cost / current_inventory.quantity) * NEW.quantity
                                      ELSE 0
                                  END
                              ))
                      END
                  ) / (current_inventory.quantity + 
                      CASE 
                          WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.quantity 
                          ELSE -NEW.quantity 
                      END)
                  ELSE 0
              END;
              
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `
    console.log("[SERVER] ✅ Created improved function")

    // Recreate the trigger
    await inventorySql`
      CREATE TRIGGER trigger_update_inventory
          AFTER INSERT ON transaction_history
          FOR EACH ROW
          EXECUTE FUNCTION update_inventory()
    `
    console.log("[SERVER] ✅ Created trigger")

    return NextResponse.json({
      success: true,
      message: "Trigger successfully updated to use UPSERT!",
    })
  } catch (error: any) {
    console.error("[SERVER] ❌ Error fixing trigger:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || String(error),
      },
      { status: 500 },
    )
  }
}
