import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inventory, transactions, laborDeployments, totalItems, totalTransactions, recentActivity } = body

    if (!inventory || !transactions || !laborDeployments) {
      return NextResponse.json({ analysis: "Insufficient data for analysis." }, { status: 400 })
    }

    const prompt = `
     Analyze the following inventory, transaction, and labor deployment data to identify trends,
     potential issues, and optimization opportunities for a honey farm. Provide specific, actionable
     recommendations. Be concise.

     Inventory Data:
     ${JSON.stringify(inventory)}

     Transaction Data (last 50 transactions):
     ${JSON.stringify(transactions)}

     Labor Deployment Data (last 50 deployments):
     ${JSON.stringify(laborDeployments)}

     Key Metrics:
     - Total Unique Items: ${totalItems}
     - Total Transactions: ${totalTransactions}
     - Recent Activity (last 24 hours): ${recentActivity}

     Focus on:
     - Identifying potential overstocking or understocking situations.
     - Analyzing transaction patterns to understand usage trends.
     - Correlating labor deployments with inventory changes.
     - Suggesting ways to improve efficiency and reduce waste.
     - Highlighting any unusual or concerning patterns.
   `

    const { text } = await generateText({
      model: groq("llama3-70b-8192"), // This line uses the Groq model
      prompt,
      maxTokens: 2500,
      temperature: 0.7,
    })

    const analysis = text
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("AI Error:", error)
    return NextResponse.json({ analysis: "Error generating AI analysis." }, { status: 500 })
  }
}
