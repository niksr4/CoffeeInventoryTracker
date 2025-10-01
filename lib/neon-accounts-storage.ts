import { accountsSql } from "./neon-connections"

export interface ActivityCode {
  code: string
  activity: string
}

export interface LaborTransaction {
  id?: number
  deployment_date: string
  code: string
  hf_laborers: number
  hf_cost_per_laborer: number
  outside_laborers: number
  outside_cost_per_laborer: number
  total_cost: number
  notes?: string
}

export interface ExpenseTransaction {
  id?: number
  entry_date: string
  code: string
  total_amount: number
  notes?: string
}

// Activity Code Functions
export async function getAllActivityCodes(): Promise<ActivityCode[]> {
  try {
    console.log("📡 Fetching all activity codes from accounts_db...")
    const result = await accountsSql`
      SELECT code, activity
      FROM account_activities
      ORDER BY code ASC
    `
    console.log(`✅ Fetched ${result.length} activity codes`)
    return result as ActivityCode[]
  } catch (error) {
    console.error("❌ Error fetching all activity codes:", error)
    throw error
  }
}

export async function searchActivityCodes(searchTerm: string): Promise<ActivityCode[]> {
  try {
    console.log(`📡 Searching activity codes for: ${searchTerm}`)
    const result = await accountsSql`
      SELECT code, activity
      FROM account_activities
      WHERE LOWER(code) LIKE LOWER(${"%" + searchTerm + "%"})
         OR LOWER(activity) LIKE LOWER(${"%" + searchTerm + "%"})
      ORDER BY code ASC
      LIMIT 10
    `
    console.log(`✅ Found ${result.length} matching activity codes`)
    return result as ActivityCode[]
  } catch (error) {
    console.error("❌ Error searching activity codes:", error)
    throw error
  }
}

export async function getActivityByCode(code: string): Promise<ActivityCode | null> {
  try {
    const result = await accountsSql`
      SELECT code, activity
      FROM account_activities
      WHERE code = ${code}
      LIMIT 1
    `
    return result.length > 0 ? (result[0] as ActivityCode) : null
  } catch (error) {
    console.error("❌ Error fetching activity by code:", error)
    throw error
  }
}

// Labor Transaction Functions
export async function addLaborTransaction(transaction: Omit<LaborTransaction, "id">): Promise<boolean> {
  try {
    console.log("📤 Adding labor transaction to accounts_db...")
    await accountsSql`
      INSERT INTO labor_transactions (
        deployment_date, code, 
        hf_laborers, hf_cost_per_laborer,
        outside_laborers, outside_cost_per_laborer,
        total_cost, notes
      )
      VALUES (
        ${transaction.deployment_date},
        ${transaction.code},
        ${transaction.hf_laborers},
        ${transaction.hf_cost_per_laborer},
        ${transaction.outside_laborers},
        ${transaction.outside_cost_per_laborer},
        ${transaction.total_cost},
        ${transaction.notes || ""}
      )
    `
    console.log("✅ Labor transaction added successfully")
    return true
  } catch (error) {
    console.error("❌ Error adding labor transaction:", error)
    return false
  }
}

export async function getAllLaborTransactions(): Promise<LaborTransaction[]> {
  try {
    console.log("📡 Fetching all labor transactions from accounts_db...")
    const result = await accountsSql`
      SELECT 
        id,
        deployment_date,
        code,
        hf_laborers,
        hf_cost_per_laborer,
        outside_laborers,
        outside_cost_per_laborer,
        total_cost,
        notes
      FROM labor_transactions
      ORDER BY deployment_date DESC
    `
    console.log(`✅ Fetched ${result.length} labor transactions`)
    return result as LaborTransaction[]
  } catch (error) {
    console.error("❌ Error fetching labor transactions:", error)
    throw error
  }
}

export async function updateLaborTransaction(id: number, transaction: Omit<LaborTransaction, "id">): Promise<boolean> {
  try {
    console.log(`📤 Updating labor transaction ${id}...`)
    await accountsSql`
      UPDATE labor_transactions
      SET 
        deployment_date = ${transaction.deployment_date},
        code = ${transaction.code},
        hf_laborers = ${transaction.hf_laborers},
        hf_cost_per_laborer = ${transaction.hf_cost_per_laborer},
        outside_laborers = ${transaction.outside_laborers},
        outside_cost_per_laborer = ${transaction.outside_cost_per_laborer},
        total_cost = ${transaction.total_cost},
        notes = ${transaction.notes || ""}
      WHERE id = ${id}
    `
    console.log("✅ Labor transaction updated successfully")
    return true
  } catch (error) {
    console.error("❌ Error updating labor transaction:", error)
    return false
  }
}

export async function deleteLaborTransaction(id: number): Promise<boolean> {
  try {
    console.log(`📤 Deleting labor transaction ${id}...`)
    await accountsSql`
      DELETE FROM labor_transactions
      WHERE id = ${id}
    `
    console.log("✅ Labor transaction deleted successfully")
    return true
  } catch (error) {
    console.error("❌ Error deleting labor transaction:", error)
    return false
  }
}

// Expense Transaction Functions
export async function addExpenseTransaction(transaction: Omit<ExpenseTransaction, "id">): Promise<boolean> {
  try {
    console.log("📤 Adding expense transaction to accounts_db...")
    await accountsSql`
      INSERT INTO expense_transactions (
        entry_date, code, total_amount, notes
      )
      VALUES (
        ${transaction.entry_date},
        ${transaction.code},
        ${transaction.total_amount},
        ${transaction.notes || ""}
      )
    `
    console.log("✅ Expense transaction added successfully")
    return true
  } catch (error) {
    console.error("❌ Error adding expense transaction:", error)
    return false
  }
}

export async function getAllExpenseTransactions(): Promise<ExpenseTransaction[]> {
  try {
    console.log("📡 Fetching all expense transactions from accounts_db...")
    const result = await accountsSql`
      SELECT 
        id,
        entry_date,
        code,
        total_amount,
        notes
      FROM expense_transactions
      ORDER BY entry_date DESC
    `
    console.log(`✅ Fetched ${result.length} expense transactions`)
    return result as ExpenseTransaction[]
  } catch (error) {
    console.error("❌ Error fetching expense transactions:", error)
    throw error
  }
}

export async function updateExpenseTransaction(
  id: number,
  transaction: Omit<ExpenseTransaction, "id">,
): Promise<boolean> {
  try {
    console.log(`📤 Updating expense transaction ${id}...`)
    await accountsSql`
      UPDATE expense_transactions
      SET 
        entry_date = ${transaction.entry_date},
        code = ${transaction.code},
        total_amount = ${transaction.total_amount},
        notes = ${transaction.notes || ""}
      WHERE id = ${id}
    `
    console.log("✅ Expense transaction updated successfully")
    return true
  } catch (error) {
    console.error("❌ Error updating expense transaction:", error)
    return false
  }
}

export async function deleteExpenseTransaction(id: number): Promise<boolean> {
  try {
    console.log(`📤 Deleting expense transaction ${id}...`)
    await accountsSql`
      DELETE FROM expense_transactions
      WHERE id = ${id}
    `
    console.log("✅ Expense transaction deleted successfully")
    return true
  } catch (error) {
    console.error("❌ Error deleting expense transaction:", error)
    return false
  }
}
