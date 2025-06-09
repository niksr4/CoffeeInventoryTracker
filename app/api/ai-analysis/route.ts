import { type NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { getAllTransactions, getAllInventoryItems } from "@/lib/storage"

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ success: false, error: "Groq API key not configured" }, { status: 500 })
    }

    const body = await request.json()
    const { analysisType, timeframe = "30" } = body

    // Get current inventory and transactions
    const inventory = await getAllInventoryItems()
    const transactions = await getAllTransactions()

    // Filter transactions by timeframe (days)
    const timeframeDays = Number.parseInt(timeframe)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays)

    const recentTransactions = transactions.filter((transaction) => {
      try {
        const transactionDate = new Date(transaction.date)
        return transactionDate >= cutoffDate
      } catch {
        return false
      }
    })

    let analysisPrompt = ""
    const systemPrompt =
      "You are an AI assistant specialized in inventory management and agricultural supply analysis. Provide practical, actionable insights based on the data provided."

    switch (analysisType) {
      case "inventory_overview":
        analysisPrompt = `
Analyze this honey farm inventory data and provide insights:

CURRENT INVENTORY:
${inventory.map((item) => `- ${item.name}: ${item.quantity} ${item.unit}`).join("\n")}

RECENT TRANSACTIONS (last ${timeframeDays} days):
${recentTransactions
  .slice(0, 20)
  .map((t) => `- ${t.date}: ${t.transactionType} ${t.quantity} ${t.unit} of ${t.itemType} (${t.notes})`)
  .join("\n")}

Please provide:
1. Overall inventory health assessment
2. Items running low (suggest reorder points)
3. Most active items in recent transactions
4. Any unusual patterns or concerns
5. Brief recommendations for inventory optimization

Keep the response concise and actionable.`
        break

      case "usage_trends":
        analysisPrompt = `
Analyze usage trends for this honey farm inventory:

RECENT TRANSACTIONS (last ${timeframeDays} days):
${recentTransactions.map((t) => `- ${t.date}: ${t.transactionType} ${t.quantity} ${t.unit} of ${t.itemType}`).join("\n")}

CURRENT STOCK LEVELS:
${inventory.map((item) => `- ${item.name}: ${item.quantity} ${item.unit}`).join("\n")}

Please analyze:
1. Which items are being depleted fastest?
2. Seasonal or time-based usage patterns
3. Items with irregular usage (spikes or drops)
4. Predicted stock-out dates for fast-moving items
5. Recommendations for inventory planning

Focus on practical insights for farm management.`
        break

      case "reorder_suggestions":
        analysisPrompt = `
Provide reorder recommendations for this honey farm inventory:

CURRENT INVENTORY:
${inventory.map((item) => `- ${item.name}: ${item.quantity} ${item.unit}`).join("\n")}

RECENT USAGE (last ${timeframeDays} days):
${recentTransactions
  .filter((t) => t.transactionType === "Depleting")
  .map((t) => `- ${t.itemType}: -${t.quantity} ${t.unit} on ${t.date}`)
  .join("\n")}

RECENT RESTOCKING:
${recentTransactions
  .filter((t) => t.transactionType === "Restocking")
  .map((t) => `- ${t.itemType}: +${t.quantity} ${t.unit} on ${t.date}`)
  .join("\n")}

Please provide:
1. Items that need immediate reordering (critical low stock)
2. Items to reorder soon (moderate priority)
3. Suggested reorder quantities based on usage patterns
4. Items that are overstocked
5. Optimal reorder timing recommendations

Format as a prioritized action list.`
        break

      case "cost_optimization":
        analysisPrompt = `
Analyze this honey farm inventory for cost optimization opportunities:

CURRENT INVENTORY:
${inventory.map((item) => `- ${item.name}: ${item.quantity} ${item.unit}`).join("\n")}

TRANSACTION HISTORY (last ${timeframeDays} days):
${recentTransactions.map((t) => `- ${t.date}: ${t.transactionType} ${t.quantity} ${t.unit} of ${t.itemType} (${t.notes})`).join("\n")}

Please identify:
1. Items with excessive stock levels (carrying cost concerns)
2. Frequently used items that could benefit from bulk purchasing
3. Items with irregular usage patterns (optimization opportunities)
4. Suggestions for reducing waste and spoilage
5. Inventory turnover insights and recommendations

Focus on practical cost-saving strategies.`
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid analysis type" }, { status: 400 })
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.3,
      max_tokens: 1000,
    })

    const analysis = completion.choices[0]?.message?.content

    if (!analysis) {
      throw new Error("No analysis generated")
    }

    return NextResponse.json({
      success: true,
      analysis,
      analysisType,
      timeframe: timeframeDays,
      dataPoints: {
        inventoryItems: inventory.length,
        recentTransactions: recentTransactions.length,
        totalTransactions: transactions.length,
      },
    })
  } catch (error) {
    console.error("AI Analysis error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate analysis",
      },
      { status: 500 },
    )
  }
}
