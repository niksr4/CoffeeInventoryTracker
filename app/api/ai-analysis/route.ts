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

    // ---------------------------------------------
    // Fetch external market context (weather + news)
    // ---------------------------------------------
    let marketContext: any = null
    try {
      // Build the origin of the current request (e.g. https://your-site.vercel.app)
      const currentUrl = new URL(request.url)
      const origin = `${currentUrl.protocol}//${currentUrl.host}`

      const marketNewsResponse = await fetch(`${origin}/api/market-news`, {
        // Revalidate every 10 minutes
        next: { revalidate: 600 },
      })

      if (marketNewsResponse.ok) {
        marketContext = await marketNewsResponse.json()
      } else {
        console.error(`Failed to fetch market news, status: ${marketNewsResponse.status}`)
      }
    } catch (err) {
      console.error("Could not fetch market news:", err)
      // Proceed without market context if it fails
    }

    // Prepare analysis prompt
    const prompt = `
    You are an AI inventory and operations analyst for a honey farm in Kodagu, India. Analyze the following internal farm data in conjunction with global market context to provide comprehensive, strategic insights.

    INTERNAL FARM DATA:
    - Current Inventory (${totalItems} items):
    ${
      inventory.length > 0
        ? inventory.map((item: any) => `  - ${item.name}: ${item.quantity.toFixed(2)} ${item.unit}`).join("\n")
        : "  No inventory data available."
    }
    - Recent Inventory Transactions (Last ${transactions?.length ?? 0} of ${totalTransactions} total):
    ${
      Array.isArray(transactions) && transactions.length > 0
        ? transactions
            .slice(0, 15)
            .map((t: any) => `  - ${t.date}: ${t.transactionType} ${t.quantity} ${t.unit} of ${t.itemType} (${t.user})`)
            .join("\n")
        : "  No recent transactions."
    }
    - Recent Labor Deployments (Last ${laborDeployments?.length ?? 0}):
    ${
      Array.isArray(laborDeployments) && laborDeployments.length > 0
        ? laborDeployments
            .slice(0, 15)
            .map(
              (l: any) =>
                `  - ${l.date}: ${l.laborEntries
                  .map((e: any) => `${e.laborCount} laborers`)
                  .join(" & ")} for "${l.reference}" (Code: ${l.code}) costing ₹${l.totalCost.toFixed(2)} (${l.user})`,
            )
            .join("\n")
        : "  No recent labor deployments."
    }

    GLOBAL COFFEE MARKET CONTEXT:
    ${
      marketContext
        ? `
    Brazil Weather (Major Competitor Region):
    - Location: ${marketContext.brazilWeather.location}
    ${
      marketContext.brazilWeather.error
        ? `  - Note: ${marketContext.brazilWeather.error}`
        : `  - Current: ${marketContext.brazilWeather.currentTempC}°C, ${marketContext.brazilWeather.condition}
    - 3-Day Forecast: ${marketContext.brazilWeather.forecast
      .map(
        (f: any) =>
          `${new Date(f.date + "T00:00:00").toLocaleDateString("en-GB", {
            weekday: "short",
          })}: ${f.condition}, ${f.minTempC}°C - ${f.maxTempC}°C`,
      )
      .join("; ")}`
    }
    Recent Market News/Trends:
    ${marketContext.marketNews.map((n: string) => `- ${n}`).join("\n  ")}
    `
        : "Could not load external market data."
    }

    Please provide a comprehensive analysis covering the following areas. Use clear section titles in CAPITAL LETTERS followed by a colon, and organize your response with bullet points and clear paragraphs:

    INVENTORY HEALTH:
    - Identify items that are running low (potential stockout risk).
    - Note any items that appear overstocked or have low turnover.

    USAGE & CONSUMPTION PATTERNS:
    - Which items are most frequently depleted?
    - Are there any noticeable trends in restocking?

    LABOR DEPLOYMENT INSIGHTS:
    - Analyze recent labor deployments. Which activities are consuming the most labor cost?
    - Correlate labor activities with inventory consumption where possible.

    OPERATIONAL RECOMMENDATIONS:
    - Suggest items that need immediate restocking.
    - Provide recommendations for operational efficiency based on both inventory and labor data.

    MARKET CONTEXT & STRATEGIC ADVICE:
    - Based on the global market context (e.g., Brazil's weather, market news), what strategic advice can you offer this specific farm in Kodagu?
    - For example, if Brazil is expecting poor weather that could impact their harvest, should this farm consider holding onto its coffee stock for potentially better prices?
    - How do the farm's current operations (e.g., spending on specific fertilizers) align with or diverge from broader market trends (e.g., trend towards organic/specialty coffee)?

    Format your response with clear section headings in CAPITAL LETTERS and use bullet points for easy reading. Do not use markdown formatting like ** or ###.
    `

    const { text } = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
      maxTokens: 2500,
      temperature: 0.7,
    })

    return NextResponse.json({ analysis: text })
  } catch (error) {
    console.error("AI Analysis error:", error)
    return NextResponse.json({ error: "Failed to generate analysis" }, { status: 500 })
  }
}
