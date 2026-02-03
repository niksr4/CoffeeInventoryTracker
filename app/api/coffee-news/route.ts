import { NextResponse } from "next/server"

export const runtime = "edge"

export async function GET() {
  try {
    const apiKey = process.env.THENEWSAPI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "News API key not configured" },
        { status: 500 }
      )
    }

    // Search for coffee-related news focusing on India, global trends, demand, supply, and forecasts
    // Broader search to ensure we get results
    const searchQuery = "coffee AND (india OR demand OR supply OR production OR market OR arabica OR robusta OR forecast OR outlook)"
    
    // Fetch all articles from 2023 to 2026
    const url = new URL("https://api.thenewsapi.com/v1/news/all")
    url.searchParams.append("api_token", apiKey)
    url.searchParams.append("search", searchQuery)
    url.searchParams.append("language", "en")
    url.searchParams.append("published_after", "2023-01-01")
    url.searchParams.append("limit", "50")
    url.searchParams.append("sort", "published_at")

    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`News API responded with status ${response.status}`)
    }

    const data = await response.json()
    const allArticles = data.data || []
    
    // Take the 10 most recent articles
    const selectedArticles = allArticles.slice(0, 10)
    
    return NextResponse.json({
      articles: selectedArticles,
      total: selectedArticles.length,
      totalFound: allArticles.length,
    })
  } catch (error) {
    console.error("Error fetching coffee news:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch coffee news",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
