import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const { inventory, transactions, totalItems, totalTransactions, recentActivity } = await request.json()

    // Prepare analysis prompt
    const prompt = `
You are an AI inventory analyst for a honey farm. Analyze the following inventory data and provide insights:

CURRENT INVENTORY (${totalItems} items):
${inventory.map((item: any) => `- ${item.name}: ${item.quantity} ${item.unit}`).join("\n")}

RECENT TRANSACTIONS (Last ${transactions.length} transactions):
${transactions
  .slice(0, 10)
  .map((t: any) => `- ${t.date}: ${t.transactionType} ${t.quantity} ${t.unit} of ${t.itemType} (${t.user})`)
  .join("\n")}

SUMMARY STATS:
- Total Items: ${totalItems}
- Total Transactions: ${totalTransactions}
- Recent Activity (24h): ${recentActivity}

Please provide a comprehensive analysis including:
1. **Inventory Health**: Items running low, overstocked items
2. **Usage Patterns**: Most/least used items, seasonal trends
3. **Recommendations**: Restocking suggestions, optimization tips
4. **Risk Assessment**: Items at risk of stockout
5. **Efficiency Insights**: Transaction patterns and user behavior

Format your response in clear sections with actionable insights.
`

    const { text } = await generateText({
      model: groq("llama3-70b-8192"), // updated model name
      prompt,
      maxTokens: 1500,
      temperature: 0.7,
    })

    return NextResponse.json({ analysis: text })
  } catch (error) {
    console.error("AI Analysis error:", error)
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 })
  }
}
