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

export interface ConsumableDeployment {
  id: string
  date: string
  code: string
  reference: string
  amount: number
  notes?: string
  user: string
}

export interface LaborDeployment {
  id: string
  code: string
  reference: string
  laborEntries: Array<{
    name: string
    laborCount: number
    costPerLabor: number
  }>
  totalCost: number
  date: string
  user: string
  notes?: string
}

export interface ExpenditureSummary {
  totalLabor: number
  totalConsumables: number
  totalExpenses: number
  laborCount: number
  consumableCount: number
}

export interface ExpenditureSummaryByCode {
  code: string
  reference: string
  totalLabor: number
  totalConsumables: number
  totalExpenses: number
  transactionCount: number
}

// Activity Code Functions
export async function getAllActivityCodes(): Promise<ActivityCode[]> {
  try {
    const result = await accountsSql`
      SELECT code, activity
      FROM account_activities
      ORDER BY code ASC
    `
    return result as ActivityCode[]
  } catch (error) {
    console.error("❌ Error fetching all activity codes:", error)
    return []
  }
}

export async function searchActivityCodes(searchTerm: string): Promise<ActivityCode[]> {
  try {
    const result = await accountsSql`
      SELECT code, activity
      FROM account_activities
      WHERE LOWER(code) LIKE LOWER(${"%" + searchTerm + "%"})
         OR LOWER(activity) LIKE LOWER(${"%" + searchTerm + "%"})
      ORDER BY code ASC
      LIMIT 10
    `
    return result as ActivityCode[]
  } catch (error) {
    console.error("❌ Error searching activity codes:", error)
    return []
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
    return null
  }
}

// Expenditure Summary Functions
export async function getExpenditureSummary(): Promise<ExpenditureSummary> {
  try {
    const laborResult = await accountsSql`
      SELECT 
        COALESCE(SUM(total_cost), 0) as total_labor,
        COUNT(*) as labor_count
      FROM labor_transactions
    `

    const consumableResult = await accountsSql`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_consumables,
        COUNT(*) as consumable_count
      FROM expense_transactions
    `

    const totalLabor = Number(laborResult[0]?.total_labor) || 0
    const totalConsumables = Number(consumableResult[0]?.total_consumables) || 0

    return {
      totalLabor,
      totalConsumables,
      totalExpenses: totalLabor + totalConsumables,
      laborCount: Number(laborResult[0]?.labor_count) || 0,
      consumableCount: Number(consumableResult[0]?.consumable_count) || 0,
    }
  } catch (error) {
    console.error("❌ Error fetching expenditure summary:", error)
    return {
      totalLabor: 0,
      totalConsumables: 0,
      totalExpenses: 0,
      laborCount: 0,
      consumableCount: 0,
    }
  }
}

export async function getExpenditureSummaryByCode(): Promise<ExpenditureSummaryByCode[]> {
  try {
    const result = await accountsSql`
      WITH labor_summary AS (
        SELECT 
          code,
          SUM(total_cost) as labor_total,
          COUNT(*) as labor_count
        FROM labor_transactions
        GROUP BY code
      ),
      consumable_summary AS (
        SELECT 
          code,
          SUM(total_amount) as consumable_total,
          COUNT(*) as consumable_count
        FROM expense_transactions
        GROUP BY code
      ),
      all_codes AS (
        SELECT DISTINCT code FROM labor_transactions
        UNION
        SELECT DISTINCT code FROM expense_transactions
      )
      SELECT 
        ac.code,
        COALESCE(aa.activity, ac.code) as reference,
        COALESCE(ls.labor_total, 0) as total_labor,
        COALESCE(cs.consumable_total, 0) as total_consumables,
        COALESCE(ls.labor_total, 0) + COALESCE(cs.consumable_total, 0) as total_expenses,
        COALESCE(ls.labor_count, 0) + COALESCE(cs.consumable_count, 0) as transaction_count
      FROM all_codes ac
      LEFT JOIN labor_summary ls ON ac.code = ls.code
      LEFT JOIN consumable_summary cs ON ac.code = cs.code
      LEFT JOIN account_activities aa ON ac.code = aa.code
      ORDER BY total_expenses DESC
    `

    return result.map((row: any) => ({
      code: String(row.code),
      reference: String(row.reference),
      totalLabor: Number(row.total_labor) || 0,
      totalConsumables: Number(row.total_consumables) || 0,
      totalExpenses: Number(row.total_expenses) || 0,
      transactionCount: Number(row.transaction_count) || 0,
    }))
  } catch (error) {
    console.error("❌ Error fetching expenditure summary by code:", error)
    return []
  }
}

// Consumable Deployment Functions
export async function getAllConsumableDeployments(): Promise<ConsumableDeployment[]> {
  try {
    const result = await accountsSql`
      SELECT 
        et.id::text,
        et.entry_date as date,
        et.code,
        COALESCE(aa.activity, et.code) as reference,
        et.total_amount as amount,
        et.notes,
        'system' as user
      FROM expense_transactions et
      LEFT JOIN account_activities aa ON et.code = aa.code
      ORDER BY et.entry_date DESC
    `

    const deployments = result.map((row: any) => ({
      id: row.id,
      date: row.date,
      code: row.code,
      reference: row.reference || row.code,
      amount: Number(row.amount),
      notes: row.notes || "",
      user: row.user,
    }))

    return deployments
  } catch (error) {
    console.error("❌ Error fetching consumable deployments:", error)
    return []
  }
}

export async function addConsumableDeployment(deployment: ConsumableDeployment): Promise<boolean> {
  try {
    await accountsSql`
      INSERT INTO expense_transactions (
        entry_date, code, total_amount, notes
      )
      VALUES (
        ${deployment.date}::timestamp,
        ${deployment.code},
        ${deployment.amount},
        ${deployment.notes || ""}
      )
    `
    return true
  } catch (error) {
    console.error("❌ Error adding consumable deployment:", error)
    return false
  }
}

export async function updateConsumableDeployment(
  id: string,
  updates: Partial<ConsumableDeployment>,
): Promise<ConsumableDeployment | null> {
  try {
    await accountsSql`
      UPDATE expense_transactions
      SET
        entry_date = COALESCE(${updates.date ? updates.date + "::timestamp" : null}, entry_date),
        code = COALESCE(${updates.code}, code),
        total_amount = COALESCE(${updates.amount}, total_amount),
        notes = COALESCE(${updates.notes}, notes)
      WHERE id = ${id}::integer
    `
    return { id, ...updates } as ConsumableDeployment
  } catch (error) {
    console.error("❌ Error updating consumable deployment:", error)
    return null
  }
}

export async function deleteConsumableDeployment(id: string): Promise<boolean> {
  try {
    await accountsSql`
      DELETE FROM expense_transactions
      WHERE id = ${id}::integer
    `
    return true
  } catch (error) {
    console.error("❌ Error deleting consumable deployment:", error)
    return false
  }
}

// Labor Deployment Functions
export async function getAllLaborDeployments(): Promise<LaborDeployment[]> {
  try {
    const result = await accountsSql`
      SELECT 
        lt.id::text,
        lt.deployment_date as date,
        lt.code,
        COALESCE(aa.activity, lt.code) as reference,
        lt.hf_laborers,
        lt.hf_cost_per_laborer,
        lt.outside_laborers,
        lt.outside_cost_per_laborer,
        lt.total_cost,
        lt.notes
      FROM labor_transactions lt
      LEFT JOIN account_activities aa ON lt.code = aa.code
      ORDER BY lt.deployment_date DESC
    `

    const deployments = result.map((row: any) => {
      const laborEntries = []

      if (row.hf_laborers && row.hf_laborers > 0) {
        laborEntries.push({
          name: "HoneyFarm",
          laborCount: row.hf_laborers,
          costPerLabor: Number(row.hf_cost_per_laborer || 0),
        })
      }

      if (row.outside_laborers && row.outside_laborers > 0) {
        laborEntries.push({
          name: "Outside Labor",
          laborCount: row.outside_laborers,
          costPerLabor: Number(row.outside_cost_per_laborer || 0),
        })
      }

      return {
        id: row.id,
        date: row.date,
        code: row.code,
        reference: row.reference || row.code,
        laborEntries,
        totalCost: Number(row.total_cost),
        notes: row.notes || "",
        user: "system",
      }
    })

    return deployments
  } catch (error) {
    console.error("❌ Error fetching labor deployments:", error)
    return []
  }
}

export async function addLaborDeployment(deployment: LaborDeployment): Promise<boolean> {
  try {
    const hfEntry = deployment.laborEntries.find((e) => e.name === "HoneyFarm")
    const outsideEntry = deployment.laborEntries.find((e) => e.name === "Outside Labor")

    await accountsSql`
      INSERT INTO labor_transactions (
        deployment_date, code,
        hf_laborers, hf_cost_per_laborer,
        outside_laborers, outside_cost_per_laborer,
        total_cost, notes
      )
      VALUES (
        ${deployment.date}::timestamp,
        ${deployment.code},
        ${hfEntry?.laborCount || 0},
        ${hfEntry?.costPerLabor || 0},
        ${outsideEntry?.laborCount || 0},
        ${outsideEntry?.costPerLabor || 0},
        ${deployment.totalCost},
        ${deployment.notes || ""}
      )
    `
    return true
  } catch (error) {
    console.error("❌ Error adding labor deployment:", error)
    return false
  }
}

export async function updateLaborDeployment(
  id: string,
  updates: Partial<LaborDeployment>,
): Promise<LaborDeployment | null> {
  try {
    if (updates.laborEntries) {
      const hfEntry = updates.laborEntries.find((e) => e.name === "HoneyFarm")
      const outsideEntry = updates.laborEntries.find((e) => e.name === "Outside Labor")

      await accountsSql`
        UPDATE labor_transactions
        SET
          deployment_date = COALESCE(${updates.date ? updates.date + "::timestamp" : null}, deployment_date),
          code = COALESCE(${updates.code}, code),
          hf_laborers = ${hfEntry?.laborCount || 0},
          hf_cost_per_laborer = ${hfEntry?.costPerLabor || 0},
          outside_laborers = ${outsideEntry?.laborCount || 0},
          outside_cost_per_laborer = ${outsideEntry?.costPerLabor || 0},
          total_cost = COALESCE(${updates.totalCost}, total_cost),
          notes = COALESCE(${updates.notes}, notes)
        WHERE id = ${id}::integer
      `
    }
    return { id, ...updates } as LaborDeployment
  } catch (error) {
    console.error("❌ Error updating labor deployment:", error)
    return null
  }
}

export async function deleteLaborDeployment(id: string): Promise<boolean> {
  try {
    await accountsSql`
      DELETE FROM labor_transactions
      WHERE id = ${id}::integer
    `
    return true
  } catch (error) {
    console.error("❌ Error deleting labor deployment:", error)
    return false
  }
}

// Expense Transaction Functions (legacy support)
export async function addExpenseTransaction(transaction: Omit<ExpenseTransaction, "id">): Promise<boolean> {
  try {
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
    return true
  } catch (error) {
    console.error("❌ Error adding expense transaction:", error)
    return false
  }
}

export async function getAllExpenseTransactions(): Promise<ExpenseTransaction[]> {
  try {
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
    return result as ExpenseTransaction[]
  } catch (error) {
    console.error("❌ Error fetching expense transactions:", error)
    return []
  }
}

export async function updateExpenseTransaction(
  id: number,
  transaction: Omit<ExpenseTransaction, "id">,
): Promise<boolean> {
  try {
    await accountsSql`
      UPDATE expense_transactions
      SET 
        entry_date = ${transaction.entry_date},
        code = ${transaction.code},
        total_amount = ${transaction.total_amount},
        notes = ${transaction.notes || ""}
      WHERE id = ${id}
    `
    return true
  } catch (error) {
    console.error("❌ Error updating expense transaction:", error)
    return false
  }
}

export async function deleteExpenseTransaction(id: number): Promise<boolean> {
  try {
    await accountsSql`
      DELETE FROM expense_transactions
      WHERE id = ${id}
    `
    return true
  } catch (error) {
    console.error("❌ Error deleting expense transaction:", error)
    return false
  }
}

export async function getAllLaborTransactions(): Promise<LaborTransaction[]> {
  try {
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
    return result as LaborTransaction[]
  } catch (error) {
    console.error("❌ Error fetching labor transactions:", error)
    return []
  }
}

export async function addLaborTransaction(transaction: Omit<LaborTransaction, "id">): Promise<boolean> {
  try {
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
    return true
  } catch (error) {
    console.error("❌ Error adding labor transaction:", error)
    return false
  }
}

export async function updateLaborTransaction(id: number, transaction: Omit<LaborTransaction, "id">): Promise<boolean> {
  try {
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
    return true
  } catch (error) {
    console.error("❌ Error updating labor transaction:", error)
    return false
  }
}

export async function deleteLaborTransaction(id: number): Promise<boolean> {
  try {
    await accountsSql`
      DELETE FROM labor_transactions
      WHERE id = ${id}
    `
    return true
  } catch (error) {
    console.error("❌ Error deleting labor transaction:", error)
    return false
  }
}
