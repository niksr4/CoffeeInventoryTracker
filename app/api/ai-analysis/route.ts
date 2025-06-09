import { type NextRequest, NextResponse } from "next/server"
import { getAllTransactions, getAllInventoryItems } from "@/lib/storage"

// Use direct HTTP calls instead of the Groq SDK to avoid browser detection issues
async function callGroqAPI(messages: any[], model = "llama-3.1-70b-versatile") {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      model,
      temperature: 0.3,
      max_tokens: 1000,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Groq API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content
}

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
      "You are an AI assistant specialized in inventory management and agricultural supply analysis. Provide practical, actionable insights based on the data provided. Format your response with clear headings and bullet points for easy reading."

    switch (analysisType) {
      case "inventory_overview":
        analysisPrompt = `
Analyze this agricultural inventory data and provide insights:

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
Analyze usage trends for this agricultural inventory:

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
Provide reorder recommendations for this agricultural inventory:

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
Analyze this agricultural inventory for cost optimization opportunities:

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

    try {
      // Use direct HTTP call to Groq API
      const analysis = await callGroqAPI([
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: analysisPrompt,
        },
      ])

      console.log("Groq API response received")

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

// Enhanced fallback mock analysis function
function generateMockAnalysis(
  analysisType: string,
  inventory: any[],
  recentTransactions: any[],
  timeframeDays: number,
): string {
  const totalItems = inventory.length
  const totalTransactions = recentTransactions.length
  const lowStockItems = inventory.filter((item) => {
    const threshold = item.unit === "kg" ? 100 : item.unit === "L" ? 10 : 5
    return item.quantity <= threshold
  })

  switch (analysisType) {
    case "inventory_overview":
      return `# Inventory Overview Analysis

## Current Status
- **Total unique items in inventory:** ${totalItems}
- **Recent transactions (${timeframeDays} days):** ${totalTransactions}
- **Low stock items:** ${lowStockItems.length}

## Key Observations
${
  inventory.length > 0
    ? `
### Stock Levels
- **Highest stock item:** ${inventory.sort((a, b) => b.quantity - a.quantity)[0]?.name} (${inventory.sort((a, b) => b.quantity - a.quantity)[0]?.quantity} ${inventory.sort((a, b) => b.quantity - a.quantity)[0]?.unit})
- **Items requiring attention:** ${lowStockItems.length} items below recommended levels

### Low Stock Alert
${lowStockItems.map((item) => `- **${item.name}:** ${item.quantity} ${item.unit} - Consider reordering`).join("\n")}
`
    : "- No inventory data available for analysis"
}

## Recommendations
1. **Monitor low-stock items regularly** - Set up automated alerts
2. **Establish reorder points** - Define minimum stock levels for critical items
3. **Review usage patterns monthly** - Track consumption trends
4. **Consider bulk purchasing** - For frequently used items to reduce costs

*This analysis is based on your current inventory data. For more detailed AI insights, ensure the AI service is properly configured.*`

    case "usage_trends":
      const restockingEvents = recentTransactions.filter((t) => t.transactionType === "Restocking")
      const depletionEvents = recentTransactions.filter((t) => t.transactionType === "Depleting")

      return `# Usage Trends Analysis

## Transaction Activity (${timeframeDays} days)
- **Total transactions:** ${totalTransactions}
- **Restocking events:** ${restockingEvents.length}
- **Depletion events:** ${depletionEvents.length}

## Activity Patterns
${
  recentTransactions.length > 0
    ? `
### Most Active Items
${Object.entries(
  recentTransactions.reduce((acc: any, t) => {
    acc[t.itemType] = (acc[t.itemType] || 0) + 1
    return acc
  }, {}),
)
  .sort(([, a]: any, [, b]: any) => b - a)
  .slice(0, 5)
  .map(([item, count]) => `- **${item}:** ${count} transactions`)
  .join("\n")}

### Recent Activity
${recentTransactions
  .slice(0, 5)
  .map(
    (t) => `- ${new Date(t.date).toLocaleDateString()}: ${t.transactionType} ${t.quantity} ${t.unit} of ${t.itemType}`,
  )
  .join("\n")}
`
    : "- Insufficient transaction data for trend analysis"
}

## Recommendations
1. **Track seasonal patterns** - Monitor usage variations throughout the year
2. **Implement automated triggers** - Set up reorder points based on usage rates
3. **Weekly monitoring** - Review consumption rates regularly
4. **Historical planning** - Use past trends to predict future needs

*This analysis is based on your transaction history. For more detailed AI insights, ensure the AI service is properly configured.*`

    case "reorder_suggestions":
      const criticalItems = inventory.filter((item) => item.quantity < 50)
      const monitorItems = inventory.filter((item) => item.quantity >= 50 && item.quantity < 200)
      const wellStockedItems = inventory.filter((item) => item.quantity >= 200)

      return `# Reorder Recommendations

## 🚨 Immediate Action Required
${
  criticalItems.length > 0
    ? criticalItems
        .map((item) => `- **${item.name}:** Current stock ${item.quantity} ${item.unit} - **REORDER NOW**`)
        .join("\n")
    : "- No critical low stock items"
}

## ⚠️ Monitor Closely
${
  monitorItems.length > 0
    ? monitorItems.map((item) => `- **${item.name}:** ${item.quantity} ${item.unit} - Monitor usage closely`).join("\n")
    : "- No items requiring close monitoring"
}

## ✅ Well Stocked
${
  wellStockedItems.length > 0
    ? wellStockedItems.map((item) => `- **${item.name}:** ${item.quantity} ${item.unit} - Adequate stock`).join("\n")
    : "- No well-stocked items"
}

## General Recommendations
1. **Set up automatic reorder points** - Define minimum stock levels
2. **Review supplier lead times** - Factor in delivery schedules
3. **Consider bulk discounts** - For high-usage items
4. **Maintain safety stock** - Keep buffer inventory for critical items

*This analysis is based on current stock levels. For more detailed AI insights, ensure the AI service is properly configured.*`

    case "cost_optimization":
      return `# Cost Optimization Analysis

## Current Inventory Overview
- **Total items tracked:** ${totalItems}
- **Recent activity:** ${totalTransactions} transactions in ${timeframeDays} days
- **Estimated total value:** $${inventory.reduce((sum, item) => sum + item.quantity * (item.unit === "kg" ? 2 : item.unit === "L" ? 5 : 10), 0).toLocaleString()}

## Optimization Opportunities

### 1. Bulk Purchasing
${
  inventory
    .filter((item) => item.quantity < 100)
    .slice(0, 5)
    .map((item) => `- **${item.name}:** Consider bulk orders to reduce unit costs`)
    .join("\n") || "- Review frequently used items for bulk purchasing opportunities"
}

### 2. Storage Efficiency
- Review storage costs for slow-moving items
- Consider just-in-time delivery for bulky items
- Optimize warehouse space utilization

### 3. Supplier Negotiation
- Leverage usage data for better pricing
- Negotiate volume discounts
- Review contract terms annually

### 4. Waste Reduction
- Monitor expiration dates closely
- Implement FIFO (First In, First Out) inventory rotation
- Track and minimize spoilage

## Cost-Saving Strategies
1. **Implement just-in-time ordering** - For fast-moving items
2. **Negotiate volume discounts** - Use historical data as leverage
3. **Reduce carrying costs** - Optimize inventory levels
4. **Minimize shipping costs** - Consolidate orders when possible

## Next Steps
1. Analyze supplier pricing structures
2. Review storage and handling costs
3. Implement inventory turnover metrics
4. Consider alternative suppliers for cost comparison

*This analysis is based on your inventory data. For more detailed AI insights, ensure the AI service is properly configured.*`

    default:
      return "Analysis type not supported in fallback mode."
  }
}
