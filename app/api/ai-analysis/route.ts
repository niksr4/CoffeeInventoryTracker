import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inventoryData, marketNews, weatherData } = body

    if (!inventoryData || inventoryData.length === 0) {
      return NextResponse.json({ error: "No inventory data provided" }, { status: 400 })
    }

    const prompt = `You are an agricultural business analyst. Analyze the following coffee farm data and provide insights:

INVENTORY DATA:
${JSON.stringify(inventoryData, null, 2)}

${marketNews ? `MARKET NEWS:\n${JSON.stringify(marketNews, null, 2)}\n` : ""}

${weatherData ? `WEATHER DATA:\n${JSON.stringify(weatherData, null, 2)}\n` : ""}

Please provide:
1. Summary of current inventory levels
2. Insights on stock trends (which items are running low, which have surplus)
3. Recommendations for inventory management
4. ${marketNews ? "Market insights and how they might affect the business" : ""}
5. ${weatherData ? "How weather conditions might impact operations" : ""}

Format your response in a clear, organized manner with sections.`

    console.log("🤖 Generating AI analysis with OpenAI GPT-4o-mini...")

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      maxTokens: 1500,
      temperature: 0.7,
    })

    console.log("✅ AI analysis generated successfully")

    return NextResponse.json({
      success: true,
      analysis: text,
    })
  } catch (error: any) {
    console.error("❌ Error generating AI analysis:", error)
    return NextResponse.json(
      {
        error: "Failed to generate AI analysis",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
