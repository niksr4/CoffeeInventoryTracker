import { NextResponse } from "next/server"
import { sql, initializeNeonTables } from "@/lib/neon"
import { redis } from "@/lib/redis"

export async function GET() {
  try {
    // Check Redis status
    let redisStatus = {
      available: false,
      inventoryTransactions: 0,
      laborDeployments: 0,
      consumableDeployments: 0,
    }

    try {
      const transactions = await redis.lrange("inventory:transactions", 0, -1)
      const laborDeployments = await redis.keys("labor:deployment:*")
      const consumableDeployments = await redis.keys("consumable:deployment:*")

      redisStatus = {
        available: true,
        inventoryTransactions: transactions.length,
        laborDeployments: laborDeployments.length,
        consumableDeployments: consumableDeployments.length,
      }
    } catch (error) {
      console.error("Redis check failed:", error)
    }

    // Check Neon status
    let neonStatus = {
      available: false,
      inventoryTransactions: 0,
      laborDeployments: 0,
      laborEntries: 0,
      consumableDeployments: 0,
    }

    try {
      await initializeNeonTables()

      const [invTrans, laborDep, laborEnt, consumDep] = await Promise.all([
        sql`SELECT COUNT(*) as count FROM inventory_transactions`,
        sql`SELECT COUNT(*) as count FROM labor_deployments`,
        sql`SELECT COUNT(*) as count FROM labor_entries`,
        sql`SELECT COUNT(*) as count FROM consumable_deployments`,
      ])

      neonStatus = {
        available: true,
        inventoryTransactions: Number.parseInt(invTrans[0].count),
        laborDeployments: Number.parseInt(laborDep[0].count),
        laborEntries: Number.parseInt(laborEnt[0].count),
        consumableDeployments: Number.parseInt(consumDep[0].count),
      }
    } catch (error) {
      console.error("Neon check failed:", error)
    }

    return NextResponse.json({
      redis: redisStatus,
      neon: neonStatus,
      migrationReady: redisStatus.available && neonStatus.available,
    })
  } catch (error) {
    console.error("Status check failed:", error)
    return NextResponse.json(
      {
        error: "Failed to check migration status",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  try {
    console.log("Starting migration from Redis to Neon...")

    // Initialize Neon tables
    await initializeNeonTables()

    const migrationResults = {
      inventoryTransactions: 0,
      laborDeployments: 0,
      laborEntries: 0,
      consumableDeployments: 0,
      errors: [],
    }

    // 1. Migrate Inventory Transactions
    try {
      const transactions = await redis.lrange("inventory:transactions", 0, -1)
      console.log(`Found ${transactions.length} inventory transactions`)

      for (const transactionStr of transactions) {
        try {
          const transaction = JSON.parse(transactionStr)

          await sql`
            INSERT INTO inventory_transactions (
              transaction_id, item_code, item_name, item_type, transaction_type,
              quantity, unit, price_per_unit, total_value, date, notes, user_id
            ) VALUES (
              ${transaction.id}, ${transaction.itemCode}, ${transaction.itemName}, 
              ${transaction.itemType}, ${transaction.type}, ${transaction.quantity},
              ${transaction.unit}, ${transaction.pricePerUnit || 0}, 
              ${transaction.totalValue || 0}, ${transaction.date}, 
              ${transaction.notes || ""}, ${transaction.userId || ""}
            ) ON CONFLICT (transaction_id) DO UPDATE SET
              item_name = EXCLUDED.item_name,
              quantity = EXCLUDED.quantity,
              total_value = EXCLUDED.total_value
          `
          migrationResults.inventoryTransactions++
        } catch (error) {
          migrationResults.errors.push(`Inventory transaction error: ${error.message}`)
        }
      }
    } catch (error) {
      migrationResults.errors.push(`Inventory migration failed: ${error.message}`)
    }

    // 2. Migrate Labor Deployments
    try {
      const laborKeys = await redis.keys("labor:deployment:*")
      console.log(`Found ${laborKeys.length} labor deployments`)

      for (const key of laborKeys) {
        try {
          const deploymentStr = await redis.get(key)
          const deployment = JSON.parse(deploymentStr)

          // Insert deployment
          await sql`
            INSERT INTO labor_deployments (
              deployment_id, date, total_workers, total_hours, total_cost, notes, user_id
            ) VALUES (
              ${deployment.id}, ${deployment.date}, ${deployment.totalWorkers || 0},
              ${deployment.totalHours || 0}, ${deployment.totalCost || 0},
              ${deployment.notes || ""}, ${deployment.userId || ""}
            ) ON CONFLICT (deployment_id) DO UPDATE SET
              total_workers = EXCLUDED.total_workers,
              total_hours = EXCLUDED.total_hours,
              total_cost = EXCLUDED.total_cost
          `
          migrationResults.laborDeployments++

          // Insert labor entries
          if (deployment.entries && Array.isArray(deployment.entries)) {
            for (const entry of deployment.entries) {
              try {
                await sql`
                  INSERT INTO labor_entries (
                    deployment_id, worker_name, hours, rate, total, task
                  ) VALUES (
                    ${deployment.id}, ${entry.workerName}, ${entry.hours},
                    ${entry.rate}, ${entry.total}, ${entry.task || ""}
                  )
                `
                migrationResults.laborEntries++
              } catch (error) {
                migrationResults.errors.push(`Labor entry error: ${error.message}`)
              }
            }
          }
        } catch (error) {
          migrationResults.errors.push(`Labor deployment error: ${error.message}`)
        }
      }
    } catch (error) {
      migrationResults.errors.push(`Labor migration failed: ${error.message}`)
    }

    // 3. Migrate Consumable Deployments
    try {
      const consumableKeys = await redis.keys("consumable:deployment:*")
      console.log(`Found ${consumableKeys.length} consumable deployments`)

      for (const key of consumableKeys) {
        try {
          const deploymentStr = await redis.get(key)
          const deployment = JSON.parse(deploymentStr)

          await sql`
            INSERT INTO consumable_deployments (
              deployment_id, item_code, item_name, quantity, unit,
              cost_per_unit, total_cost, date, purpose, notes, user_id
            ) VALUES (
              ${deployment.id}, ${deployment.itemCode}, ${deployment.itemName},
              ${deployment.quantity}, ${deployment.unit}, ${deployment.costPerUnit || 0},
              ${deployment.totalCost || 0}, ${deployment.date}, ${deployment.purpose || ""},
              ${deployment.notes || ""}, ${deployment.userId || ""}
            ) ON CONFLICT (deployment_id) DO UPDATE SET
              quantity = EXCLUDED.quantity,
              total_cost = EXCLUDED.total_cost
          `
          migrationResults.consumableDeployments++
        } catch (error) {
          migrationResults.errors.push(`Consumable deployment error: ${error.message}`)
        }
      }
    } catch (error) {
      migrationResults.errors.push(`Consumable migration failed: ${error.message}`)
    }

    // 4. Update inventory items from transactions
    try {
      await sql`
        INSERT INTO inventory_items (item_code, item_name, item_type, current_quantity, unit, base_price)
        SELECT 
          item_code,
          item_name,
          item_type,
          SUM(CASE 
            WHEN transaction_type = 'restock' THEN quantity
            WHEN transaction_type = 'deplete' THEN -quantity
            ELSE 0
          END) as current_quantity,
          unit,
          AVG(price_per_unit) as base_price
        FROM inventory_transactions
        GROUP BY item_code, item_name, item_type, unit
        ON CONFLICT (item_code) DO UPDATE SET
          current_quantity = EXCLUDED.current_quantity,
          base_price = EXCLUDED.base_price,
          last_updated = CURRENT_TIMESTAMP
      `
    } catch (error) {
      migrationResults.errors.push(`Inventory items update failed: ${error.message}`)
    }

    console.log("Migration completed:", migrationResults)

    return NextResponse.json({
      success: true,
      data: migrationResults,
    })
  } catch (error) {
    console.error("Migration failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
