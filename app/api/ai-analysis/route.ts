import { type NextRequest, NextResponse } from "next/server"
import { getAllTransactions, getAllInventoryItems } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    console.log("AI Analysis API called")

    // Check for admin authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.includes("admin")) {
      return NextResponse.json({ success: false, error: "Admin access required for AI analysis" }, { status: 403 })
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY not found in environment variables")
      return NextResponse.json({ success: false, error: "Groq API key not configured" }, { status: 500 })
    }

    const body = await request.json()
    console.log("Request body:", body)
    const { analysisType, timeframe = "30" } = body

    // Get current inventory and transactions
    console.log("Fetching inventory and transactions...")
    const inventory = await getAllInventoryItems()
    const transactions = await getAllTransactions()

    console.log(`Found ${inventory.length} inventory items and ${transactions.length} transactions`)

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

    // If no data available, return a helpful message
    if (inventory.length === 0 && transactions.length === 0) {
      return NextResponse.json({
        success: true,
        analysis:
          "No inventory data available for analysis. Please add some inventory transactions first to get meaningful insights.",
        analysisType,
        timeframe: timeframeDays,
        dataPoints: {
          inventoryItems: 0,
          recentTransactions: 0,
          totalTransactions: 0,
        },
      })
    }

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

    console.log("Calling Groq API with prompt length:", analysisPrompt.length)

    // Try to import and use Groq SDK
    try {
      const { default: Groq } = await import("groq-sdk")

      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
      })

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

      console.log("Groq API response received")

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
    } catch (groqError) {
      console.error("Groq API error:", groqError)

      // Fallback to mock analysis if Groq fails
      const mockAnalysis = generateMockAnalysis(analysisType, inventory, recentTransactions, timeframeDays)

      return NextResponse.json({
        success: true,
        analysis: mockAnalysis,
        analysisType,
        timeframe: timeframeDays,
        dataPoints: {
          inventoryItems: inventory.length,
          recentTransactions: recentTransactions.length,
          totalTransactions: transactions.length,
        },
        note: "Generated using fallback analysis due to AI service unavailability",
      })
    }
  } catch (error) {
    console.error("AI Analysis error details:", error)

    // More specific error handling
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json({ success: false, error: "Invalid or missing Groq API key" }, { status: 401 })
      }
      if (error.message.includes("rate limit")) {
        return NextResponse.json(
          { success: false, error: "API rate limit exceeded. Please try again later." },
          { status: 429 },
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate analysis",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    )
  }
}

// Fallback mock analysis function
function generateMockAnalysis(
  analysisType: string,
  inventory: any[],
  recentTransactions: any[],
  timeframeDays: number,
): string {
  const totalItems = inventory.length
  const totalTransactions = recentTransactions.length

  switch (analysisType) {
    case "inventory_overview":
      return `## Inventory Overview Analysis

**Current Status:**
- Total unique items in inventory: ${totalItems}
- Recent transactions (${timeframeDays} days): ${totalTransactions}

**Key Observations:**
${
  inventory.length > 0
    ? `
- Highest stock item: ${inventory.sort((a, b) => b.quantity - a.quantity)[0]?.name} (${inventory[0]?.quantity} ${inventory[0]?.unit})
- Items requiring attention: ${inventory.filter((item) => item.quantity < 100).length} items below 100 units
`
    : "- No inventory data available"
}

**Recommendations:**
1. Monitor low-stock items regularly
2. Establish reorder points for critical items
3. Review usage patterns monthly
4. Consider bulk purchasing for frequently used items

*Note: This is a basic analysis. For detailed AI insights, please ensure the AI service is properly configured.*`

    case "usage_trends":
      return `## Usage Trends Analysis

**Transaction Activity (${timeframeDays} days):**
- Total transactions: ${totalTransactions}
- Restocking events: ${recentTransactions.filter((t) => t.transactionType === "Restocking").length}
- Depletion events: ${recentTransactions.filter((t) => t.transactionType === "Depleting").length}

**Trending Items:**
${
  recentTransactions.length > 0
    ? `
- Most active items based on recent transactions
- Usage patterns suggest regular consumption cycles
`
    : "- Insufficient transaction data for trend analysis"
}

**Recommendations:**
1. Track seasonal usage patterns
2. Implement automated reorder triggers
3. Monitor consumption rates weekly
4. Plan inventory based on historical trends

*Note: This is a basic analysis. For detailed AI insights, please ensure the AI service is properly configured.*`

    case "reorder_suggestions":
      return `## Reorder Recommendations

**Immediate Action Required:**
${
  inventory
    .filter((item) => item.quantity < 50)
    .map((item) => `- ${item.name}: Current stock ${item.quantity} ${item.unit} - REORDER NOW`)
    .join("\n") || "- No critical low stock items"
}

**Monitor Closely:**
${
  inventory
    .filter((item) => item.quantity >= 50 && item.quantity < 200)
    .map((item) => `- ${item.name}: ${item.quantity} ${item.unit} - Monitor usage`)
    .join("\n") || "- No items requiring close monitoring"
}

**Well Stocked:**
${
  inventory
    .filter((item) => item.quantity >= 200)
    .map((item) => `- ${item.name}: ${item.quantity} ${item.unit} - Adequate stock`)
    .join("\n") || "- No well-stocked items"
}

**General Recommendations:**
1. Set up automatic reorder points
2. Review supplier lead times
3. Consider bulk discounts for high-usage items
4. Maintain safety stock levels

*Note: This is a basic analysis. For detailed AI insights, please ensure the AI service is properly configured.*`

    case "cost_optimization":
      return `## Cost Optimization Analysis

**Current Inventory Value:**
- Total items tracked: ${totalItems}
- Recent activity: ${totalTransactions} transactions in ${timeframeDays} days

**Optimization Opportunities:**
1. **Bulk Purchasing:** Consider bulk orders for frequently used items
2. **Storage Efficiency:** Review storage costs for slow-moving items
3. **Supplier Negotiation:** Leverage usage data for better pricing
4. **Waste Reduction:** Monitor expiration dates and usage patterns

**Cost-Saving Strategies:**
- Implement just-in-time ordering for fast-moving items
- Negotiate volume discounts with suppliers
- Reduce carrying costs for excess inventory
- Optimize order frequencies to minimize shipping costs

**Next Steps:**
1. Analyze supplier pricing structures
2. Review storage and handling costs
3. Implement inventory turnover metrics
4. Consider alternative suppliers for cost comparison

*Note: This is a basic analysis. For detailed AI insights, please ensure the AI service is properly configured.*`

    default:
      return "Analysis type not supported in fallback mode."
  }
}
