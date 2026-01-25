import { neon } from "@neondatabase/serverless"
import { getFiscalYearDateRange, getCurrentFiscalYear } from "@/lib/fiscal-year-utils"

// Get database connections
const getInventoryDb = () => neon(process.env.DATABASE_URL!)
const getAccountsDb = () => neon(process.env.DATABASE_URL!.replace(/\/[^/]+$/, "/accounts_db"))
const getProcessingDb = () => neon(process.env.DATABASE_URL!.replace(/\/[^/]+$/, "/processing_db"))
const getRainfallDb = () => neon(process.env.DATABASE_URL!.replace(/\/[^/]+$/, "/Rainfall"))
const getDispatchDb = () => neon(process.env.DATABASE_URL!.replace(/\/[^/]+$/, "/dispatch"))

export async function POST(req: Request) {
  try {
    const { inventory, transactions } = await req.json()
    
    const fiscalYear = getCurrentFiscalYear()
    const { startDate, endDate } = getFiscalYearDateRange(fiscalYear)

    // Fetch data from various tabs
    const [
      laborData,
      processingData,
      rainfallData,
      expenseData,
      dispatchData
    ] = await Promise.all([
      fetchLaborData(startDate, endDate),
      fetchProcessingData(startDate, endDate),
      fetchRainfallData(),
      fetchExpenseData(startDate, endDate),
      fetchDispatchData(startDate, endDate)
    ])

    // Build comprehensive data summary for AI
    const dataSummary = buildDataSummary({
      inventory,
      transactions,
      laborData,
      processingData,
      rainfallData,
      expenseData,
      dispatchData,
      fiscalYear: fiscalYear.label
    })

    // Generate AI analysis using Groq REST API directly
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are an expert agricultural business analyst for a coffee and pepper estate in India. Provide detailed, actionable insights based on the data provided."
          },
          {
            role: "user",
            content: `Analyze the following data from the Honey Farm Inventory System and provide actionable insights.

${dataSummary}

Please provide a comprehensive analysis covering:

1. **Inventory Insights**: Analyze stock levels, consumption patterns, and restocking needs. Identify items that may need attention.

2. **Processing Performance**: Evaluate coffee processing efficiency across locations (HF Arabica, HF Robusta, MV Robusta, PG Robusta). Compare yields, dry parchment vs dry cherry output, and identify any anomalies or trends.

3. **Labor & Cost Analysis**: Review labor deployment patterns - HF workers vs outside workers, cost per day, and activity distribution. Identify opportunities for cost optimization and labor efficiency.

4. **Weather Impact**: If rainfall data is available, correlate it with processing activities and suggest optimal timing for various operations.

5. **Cross-Tab Patterns**: Identify connections between different data points (e.g., labor costs vs processing output, inventory consumption vs processing volume, rainfall vs labor deployment).

6. **Recommendations**: Provide 3-5 specific, actionable recommendations to improve operations, reduce costs, and increase efficiency.

Format your response with clear sections using markdown headers (##). Be specific with numbers and percentages where data allows. Keep the tone professional but accessible.`
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json()
      throw new Error(errorData.error?.message || "Groq API request failed")
    }

    const groqData = await groqResponse.json()
    const analysisText = groqData.choices?.[0]?.message?.content || "No analysis generated"

    return Response.json({
      success: true,
      analysis: analysisText
    })
  } catch (error) {
    console.error("AI Analysis error:", error)
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to generate analysis" },
      { status: 500 }
    )
  }
}

async function fetchLaborData(startDate: string, endDate: string) {
  try {
    const sql = getAccountsDb()
    const result = await sql`
      SELECT 
        deployment_date,
        hf_laborers,
        hf_cost_per_laborer,
        outside_laborers,
        outside_cost_per_laborer,
        total_cost,
        code,
        notes
      FROM labor_transactions
      WHERE deployment_date >= ${startDate} AND deployment_date <= ${endDate}
      ORDER BY deployment_date DESC
      LIMIT 100
    `
    return result
  } catch (error) {
    console.error("Error fetching labor data:", error)
    return []
  }
}

// Helper functions for each processing table (Neon requires tagged template literals)
// Using correct column names: dry_parch, dry_cherry (not dry_p_today, dry_cherry_today)
async function fetchHfArabicaProcessing(start: string, end: string) {
  const sql = getProcessingDb()
  return sql`SELECT process_date, crop_today, ripe_today, green_today, float_today, wet_parchment, dry_parch, dry_cherry, dry_p_bags, dry_cherry_bags, dry_p_bags_todate, dry_cherry_bags_todate FROM hf_arabica WHERE process_date >= ${start}::date AND process_date <= ${end}::date ORDER BY process_date DESC LIMIT 50`
}

async function fetchHfRobustaProcessing(start: string, end: string) {
  const sql = getProcessingDb()
  return sql`SELECT process_date, crop_today, ripe_today, green_today, float_today, wet_parchment, dry_parch, dry_cherry, dry_p_bags, dry_cherry_bags, dry_p_bags_todate, dry_cherry_bags_todate FROM hf_robusta WHERE process_date >= ${start}::date AND process_date <= ${end}::date ORDER BY process_date DESC LIMIT 50`
}

async function fetchMvRobustaProcessing(start: string, end: string) {
  const sql = getProcessingDb()
  return sql`SELECT process_date, crop_today, ripe_today, green_today, float_today, wet_parchment, dry_parch, dry_cherry, dry_p_bags, dry_cherry_bags, dry_p_bags_todate, dry_cherry_bags_todate FROM mv_robusta WHERE process_date >= ${start}::date AND process_date <= ${end}::date ORDER BY process_date DESC LIMIT 50`
}

async function fetchPgRobustaProcessing(start: string, end: string) {
  const sql = getProcessingDb()
  return sql`SELECT process_date, crop_today, ripe_today, green_today, float_today, wet_parchment, dry_parch, dry_cherry, dry_p_bags, dry_cherry_bags, dry_p_bags_todate, dry_cherry_bags_todate FROM pg_robusta WHERE process_date >= ${start}::date AND process_date <= ${end}::date ORDER BY process_date DESC LIMIT 50`
}

async function fetchProcessingData(startDate: string, endDate: string) {
  try {
    const [hfArabica, hfRobusta, mvRobusta, pgRobusta] = await Promise.all([
      fetchHfArabicaProcessing(startDate, endDate).catch(() => []),
      fetchHfRobustaProcessing(startDate, endDate).catch(() => []),
      fetchMvRobustaProcessing(startDate, endDate).catch(() => []),
      fetchPgRobustaProcessing(startDate, endDate).catch(() => [])
    ])
    
    return {
      "HF Arabica": hfArabica,
      "HF Robusta": hfRobusta,
      "MV Robusta": mvRobusta,
      "PG Robusta": pgRobusta
    }
  } catch (error) {
    console.error("Error fetching processing data:", error)
    return {}
  }
}

async function fetchRainfallData() {
  try {
    const sql = getRainfallDb()
    const currentYear = new Date().getFullYear()
    const result = await sql`
      SELECT 
        record_date,
        inches,
        cents
      FROM rainfall_records
      WHERE EXTRACT(YEAR FROM record_date) = ${currentYear}
      ORDER BY record_date DESC
      LIMIT 365
    `
    return result
  } catch (error) {
    console.error("Error fetching rainfall data:", error)
    return []
  }
}

async function fetchExpenseData(startDate: string, endDate: string) {
  try {
    const sql = getAccountsDb()
    const result = await sql`
      SELECT 
        entry_date,
        code,
        total_amount,
        notes
      FROM expense_transactions
      WHERE entry_date >= ${startDate} AND entry_date <= ${endDate}
      ORDER BY entry_date DESC
      LIMIT 100
    `
    return result
  } catch (error) {
    console.error("Error fetching expense data:", error)
    return []
  }
}

async function fetchDispatchData(startDate: string, endDate: string) {
  try {
    const sql = getDispatchDb()
    const result = await sql`
      SELECT 
        dispatch_date,
        estate,
        coffee_type,
        bag_type,
        bags_dispatched,
        price_per_bag,
        buyer_name
      FROM dispatch_records
      WHERE dispatch_date >= ${startDate}::date AND dispatch_date <= ${endDate}::date
      ORDER BY dispatch_date DESC
      LIMIT 100
    `
    return result
  } catch (error) {
    // Silently handle if table doesn't exist yet
    const errorMessage = error instanceof Error ? error.message : ""
    if (!errorMessage.includes("does not exist")) {
      console.error("Error fetching dispatch data:", error)
    }
    return []
  }
}

interface DataSummaryInput {
  inventory: Array<{ name: string; quantity: number; unit: string }>
  transactions: Array<{ itemType: string; quantity: number; transactionType: string; date: string; totalCost?: number }>
  laborData: Array<{ deployment_date: string; hf_laborers: number; hf_cost_per_laborer: number; outside_laborers: number; outside_cost_per_laborer: number; total_cost: number; code: string }>
  processingData: Record<string, Array<{ process_date: string; crop_today: number; ripe_today: number; dry_p_bags: number; dry_cherry_bags: number }>>
  rainfallData: Array<{ record_date: string; inches: number; cents: number }>
  expenseData: Array<{ entry_date: string; code: string; total_amount: number }>
  dispatchData: Array<{ dispatch_date: string; estate: string; coffee_type: string; bag_type: string; bags_dispatched: number; price_per_bag: number; buyer_name: string }>
  fiscalYear: string
}

function buildDataSummary(data: DataSummaryInput): string {
  const sections: string[] = []
  
  sections.push(`## Fiscal Year: ${data.fiscalYear}`)
  sections.push(`## Analysis Date: ${new Date().toLocaleDateString('en-IN')}`)
  
  // Inventory summary
  if (data.inventory && data.inventory.length > 0) {
    sections.push("\n## Current Inventory Status")
    const lowStock = data.inventory.filter(i => i.quantity < 10)
    const highStock = data.inventory.filter(i => i.quantity > 100)
    sections.push(`- Total items tracked: ${data.inventory.length}`)
    sections.push(`- Items with low stock (<10 units): ${lowStock.length}`)
    if (lowStock.length > 0) {
      sections.push(`  - Low stock items: ${lowStock.map(i => `${i.name} (${i.quantity} ${i.unit})`).join(", ")}`)
    }
    sections.push(`- Items with high stock (>100 units): ${highStock.length}`)
  }
  
  // Transaction summary
  if (data.transactions && data.transactions.length > 0) {
    sections.push("\n## Transaction Activity")
    const restocking = data.transactions.filter(t => t.transactionType === "Restocking")
    const depleting = data.transactions.filter(t => t.transactionType === "Depleting")
    const totalRestockCost = restocking.reduce((sum, t) => sum + (Number(t.totalCost) || 0), 0)
    sections.push(`- Total transactions: ${data.transactions.length}`)
    sections.push(`- Restocking transactions: ${restocking.length} (Total cost: ₹${totalRestockCost.toLocaleString()})`)
    sections.push(`- Depleting transactions: ${depleting.length}`)
  }
  
  // Labor summary
  if (data.laborData && data.laborData.length > 0) {
    sections.push("\n## Labor Deployment Summary")
    const totalHFWorkers = data.laborData.reduce((sum, l) => sum + (Number(l.hf_laborers) || 0), 0)
    const totalHFAmount = data.laborData.reduce((sum, l) => sum + (Number(l.hf_laborers) || 0) * (Number(l.hf_cost_per_laborer) || 0), 0)
    const totalOutsideWorkers = data.laborData.reduce((sum, l) => sum + (Number(l.outside_laborers) || 0), 0)
    const totalOutsideAmount = data.laborData.reduce((sum, l) => sum + (Number(l.outside_laborers) || 0) * (Number(l.outside_cost_per_laborer) || 0), 0)
    const totalCost = data.laborData.reduce((sum, l) => sum + (Number(l.total_cost) || 0), 0)
    sections.push(`- Total labor entries: ${data.laborData.length}`)
    sections.push(`- HF Workers deployed: ${totalHFWorkers} (Total: ₹${totalHFAmount.toLocaleString()})`)
    sections.push(`- Outside Workers deployed: ${totalOutsideWorkers} (Total: ₹${totalOutsideAmount.toLocaleString()})`)
    sections.push(`- Total labor cost: ₹${totalCost.toLocaleString()}`)
  }
  
  // Processing summary
  if (data.processingData && Object.keys(data.processingData).length > 0) {
    sections.push("\n## Coffee Processing Summary")
    let totalAllCrop = 0
    let totalAllDryP = 0
    let totalAllDryCherry = 0
    
    for (const [location, records] of Object.entries(data.processingData)) {
      if (records && records.length > 0) {
        const totalCrop = records.reduce((sum, r) => sum + (Number(r.crop_today) || 0), 0)
        const totalRipe = records.reduce((sum, r) => sum + (Number(r.ripe_today) || 0), 0)
        const totalDryPBags = records.reduce((sum, r) => sum + (Number(r.dry_p_bags) || 0), 0)
        const totalDryCherryBags = records.reduce((sum, r) => sum + (Number(r.dry_cherry_bags) || 0), 0)
        
        totalAllCrop += totalCrop
        totalAllDryP += totalDryPBags
        totalAllDryCherry += totalDryCherryBags
        
        sections.push(`\n### ${location}`)
        sections.push(`- Processing days: ${records.length}`)
        sections.push(`- Total crop: ${totalCrop.toFixed(2)} kg, Ripe: ${totalRipe.toFixed(2)} kg`)
        sections.push(`- Dry P Bags: ${totalDryPBags.toFixed(2)}, Dry Cherry Bags: ${totalDryCherryBags.toFixed(2)}`)
      }
    }
    
    sections.push(`\n### Overall Processing Totals`)
    sections.push(`- Total crop processed: ${totalAllCrop.toFixed(2)} kg`)
    sections.push(`- Total Dry P Bags: ${totalAllDryP.toFixed(2)}, Total Dry Cherry Bags: ${totalAllDryCherry.toFixed(2)}`)
  }
  
  // Rainfall summary
  if (data.rainfallData && data.rainfallData.length > 0) {
    sections.push("\n## Rainfall Data")
    const totalRainfall = data.rainfallData.reduce((sum, r) => {
      return sum + (Number(r.inches) || 0) + (Number(r.cents) || 0) / 100
    }, 0)
    const monthlyRain: Record<string, number> = {}
    data.rainfallData.forEach(r => {
      const month = new Date(r.record_date).toLocaleString('default', { month: 'short' })
      if (!monthlyRain[month]) monthlyRain[month] = 0
      monthlyRain[month] += (Number(r.inches) || 0) + (Number(r.cents) || 0) / 100
    })
    sections.push(`- Total rainfall this year: ${totalRainfall.toFixed(2)} inches`)
    sections.push(`- Recording days: ${data.rainfallData.length}`)
    sections.push(`- Monthly breakdown: ${Object.entries(monthlyRain).map(([m, v]) => `${m}: ${v.toFixed(2)}`).join(", ")}`)
  }
  
  // Expense summary
  if (data.expenseData && data.expenseData.length > 0) {
    sections.push("\n## Other Expenses Summary")
    const totalExpenses = data.expenseData.reduce((sum, e) => sum + (Number(e.total_amount) || 0), 0)
    const byActivity: Record<string, number> = {}
    data.expenseData.forEach(e => {
      const code = e.code || "Uncategorized"
      if (!byActivity[code]) byActivity[code] = 0
      byActivity[code] += Number(e.total_amount) || 0
    })
    sections.push(`- Total other expenses: ₹${totalExpenses.toLocaleString()}`)
    sections.push(`- Number of expense entries: ${data.expenseData.length}`)
    const topExpenses = Object.entries(byActivity).sort((a, b) => b[1] - a[1]).slice(0, 5)
    if (topExpenses.length > 0) {
      sections.push(`- Top expense categories: ${topExpenses.map(([code, amt]) => `${code}: ₹${amt.toLocaleString()}`).join(", ")}`)
    }
  }
  
  // Dispatch summary
  if (data.dispatchData && data.dispatchData.length > 0) {
    sections.push("\n## Dispatch Summary")
    const totalDispatches = data.dispatchData.length
    const totalBagsDispatched = data.dispatchData.reduce((sum, d) => sum + (Number(d.bags_dispatched) || 0), 0)
    const totalRevenue = data.dispatchData.reduce((sum, d) => sum + ((Number(d.bags_dispatched) || 0) * (Number(d.price_per_bag) || 0)), 0)
    
    // Group by coffee type
    const byCoffeeType: Record<string, { bags: number; revenue: number }> = {}
    data.dispatchData.forEach(d => {
      const coffeeType = d.coffee_type || "Unknown"
      if (!byCoffeeType[coffeeType]) byCoffeeType[coffeeType] = { bags: 0, revenue: 0 }
      byCoffeeType[coffeeType].bags += Number(d.bags_dispatched) || 0
      byCoffeeType[coffeeType].revenue += (Number(d.bags_dispatched) || 0) * (Number(d.price_per_bag) || 0)
    })
    
    // Group by buyer
    const byBuyer: Record<string, number> = {}
    data.dispatchData.forEach(d => {
      const buyer = d.buyer_name || "Unknown"
      if (!byBuyer[buyer]) byBuyer[buyer] = 0
      byBuyer[buyer] += Number(d.bags_dispatched) || 0
    })
    
    sections.push(`- Total dispatch entries: ${totalDispatches}`)
    sections.push(`- Total bags dispatched: ${totalBagsDispatched.toFixed(2)}`)
    sections.push(`- Total revenue: ₹${totalRevenue.toLocaleString()}`)
    
    const coffeeTypeSummary = Object.entries(byCoffeeType).map(([type, data]) => `${type}: ${data.bags.toFixed(2)} bags (₹${data.revenue.toLocaleString()})`).join(", ")
    sections.push(`- By coffee type: ${coffeeTypeSummary}`)
    
    const topBuyers = Object.entries(byBuyer).sort((a, b) => b[1] - a[1]).slice(0, 3)
    if (topBuyers.length > 0) {
      sections.push(`- Top buyers: ${topBuyers.map(([buyer, bags]) => `${buyer}: ${bags.toFixed(2)} bags`).join(", ")}`)
    }
  }
  
  return sections.join("\n")
}
