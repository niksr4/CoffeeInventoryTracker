import { generateText } from "ai"

export async function POST(req: Request) {
  console.log("[v0] AI Analysis API called")
  try {
    const data = await req.json()
    console.log("[v0] Request data received:", Object.keys(data))

    const {
      inventory,
      transactions,
      laborDeployments,
      processingRecords,
      accountsData,
      totalItems,
      totalTransactions,
      recentActivity,
    } = data

    const prompt = `You are an agricultural business analyst for a coffee farm. Analyze the following data and provide actionable insights, KPIs, and recommendations.

**INVENTORY DATA:**
Total Items: ${totalItems || 0}
Total Transactions: ${totalTransactions || 0}
Recent Activity (last 24h): ${recentActivity || 0}
${inventory ? `Sample Items: ${JSON.stringify(inventory.slice(0, 5))}` : "No inventory data available"}

**TRANSACTION DATA:**
${transactions ? `Recent Transactions (${transactions.length}): ${JSON.stringify(transactions.slice(0, 10))}` : "No transaction data available"}

**LABOR DEPLOYMENTS:**
${laborDeployments ? `Labor Records (${laborDeployments.length}): ${JSON.stringify(laborDeployments)}` : "No labor data available"}

**PROCESSING RECORDS:**
${processingRecords ? `Processing Data: ${JSON.stringify(processingRecords)}` : "No processing data available"}

**ACCOUNTS DATA:**
${accountsData ? `Financial Data: ${JSON.stringify(accountsData)}` : "No accounts data available"}

Please provide:
1. Key Performance Indicators (KPIs)
2. Trends and Patterns Analysis
3. Cost Efficiency Insights
4. Labor Productivity Metrics
5. Processing Efficiency Analysis
6. Inventory Management Recommendations
7. Financial Health Overview
8. Actionable Recommendations

Format your response in clear sections with bullet points and specific numbers where applicable.`

    console.log("[v0] Calling Groq AI with model: groq/llama-3.3-70b-versatile")
    const { text } = await generateText({
      model: "groq/llama-3.3-70b-versatile",
      prompt,
      maxTokens: 2000,
      temperature: 0.7,
    })

    console.log("[v0] AI response received, length:", text.length)
    return Response.json({
      success: true,
      analysis: text,
    })
  } catch (error) {
    console.error("[v0] AI Analysis API error:", error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate analysis",
      },
      { status: 500 },
    )
  }
}
