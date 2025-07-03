import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const {
      inventory = [],
      transactions = [],
      laborDeployments = [],
      totalItems = inventory.length,
      totalTransactions = transactions.length,
      recentActivity = 0,
    } = await request.json()

    // Prepare analysis prompt
    const prompt = `
    You are an AI inventory and operations analyst for a honey farm. Analyze the following data and provide comprehensive insights.

    CURRENT INVENTORY (${totalItems} items):
    ${
      inventory.length > 0
        ? inventory.map((item: any) => `- ${item.name}: ${item.quantity.toFixed(2)} ${item.unit}`).join("\n")
        : "No inventory data available."
    }

    RECENT INVENTORY TRANSACTIONS (Last ${transactions?.length ?? 0} of ${totalTransactions} total):
    ${
      Array.isArray(transactions) && transactions.length > 0
        ? transactions
            .slice(0, 15)
            .map((t: any) => `- ${t.date}: ${t.transactionType} ${t.quantity} ${t.unit} of ${t.itemType} (${t.user})`)
            .join("\n")
        : "No recent transactions."
    }

    RECENT LABOR DEPLOYMENTS (Last ${laborDeployments?.length ?? 0}):
    ${
      Array.isArray(laborDeployments) && laborDeployments.length > 0
        ? laborDeployments
            .slice(0, 15)
            .map(
              (l: any) =>
                `- ${l.date}: ${l.laborEntries
                  .map((e: any) => `${e.laborCount} laborers`)
                  .join(" & ")} for "${l.reference}" (Code: ${l.code}) costing ₹${l.totalCost.toFixed(2)} (${l.user})`,
            )
            .join("\n")
        : "No recent labor deployments."
    }

    SUMMARY STATS:
    - Total Unique Inventory Items: ${totalItems}
    - Total Inventory Transactions: ${totalTransactions}
    - Recent Inventory Activity (24h): ${recentActivity} transactions

    Please provide a comprehensive analysis covering the following areas:

    1.  **Inventory Health**:
        - Identify items that are running low (potential stockout risk).
        - Note any items that appear overstocked or have low turnover based on recent transactions.
        - Mention the current names of all items in the inventory.

    2.  **Usage & Consumption Patterns**:
        - Which items are most frequently depleted?
        - Are there any noticeable trends in restocking (e.g., large infrequent purchases vs. small frequent ones)?

    3.  **Labor Deployment Insights**:
        - Analyze the recent labor deployments. Which activities (based on reference/code) are consuming the most labor cost?
        - Are there patterns in labor deployment (e.g., specific days, frequent activities)?
        - Correlate labor activities with inventory consumption where possible (e.g., "Harvesting" labor followed by "Coffee Cherry" depletion).

    4.  **Operational Recommendations**:
        - Suggest items that need immediate restocking.
        - Provide recommendations for operational efficiency based on both inventory and labor data (e.g., "High spending on 'Weeding' labor could be optimized by...").
        - Highlight any potential data entry errors or inconsistencies you notice.

    Format your response in clear, actionable sections using markdown.
    `

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      maxTokens: 2000,
      temperature: 0.7,
    })

    return NextResponse.json({ analysis: text })
  } catch (error) {
    console.error("AI Analysis error:", error)
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 })
  }
}
