import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

// Parse the base connection string
const baseUrl = process.env.DATABASE_URL

// Helper to replace database name in connection string
function getDatabaseUrl(dbName: string): string {
  const url = new URL(baseUrl)
  // Replace the database name in the pathname (format: /original_db)
  url.pathname = `/${dbName}`
  return url.toString()
}

// Create separate connections for each database
export const inventorySql = neon(getDatabaseUrl("inventory_db"))
export const accountsSql = neon(getDatabaseUrl("accounts_db"))

// Test connections
export async function testConnections() {
  try {
    const inventoryTest = await inventorySql`SELECT current_database(), version()`
    const accountsTest = await accountsSql`SELECT current_database(), version()`

    console.log("✅ Inventory DB connected:", inventoryTest[0].current_database)
    console.log("✅ Accounts DB connected:", accountsTest[0].current_database)

    return {
      inventory: inventoryTest[0].current_database,
      accounts: accountsTest[0].current_database,
      success: true,
    }
  } catch (error) {
    console.error("❌ Database connection test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
