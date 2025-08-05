import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

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

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    })

    const analysis = completion.choices[0].message.content
    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("OpenAI Error:", error)
    return NextResponse.json({ analysis: "Error generating AI analysis." }, { status: 500 })
  }
}
