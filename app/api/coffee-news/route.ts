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

    // Calculate date from 2 years ago
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    const publishedAfter = twoYearsAgo.toISOString().split('T')[0]

    // Search for coffee-related news with multiple keywords
    const searchQuery = "coffee OR arabica OR robusta OR coffee price OR coffee market OR coffee demand OR coffee supply"
    
    const url = new URL("https://api.thenewsapi.com/v1/news/all")
    url.searchParams.append("api_token", apiKey)
    url.searchParams.append("search", searchQuery)
    url.searchParams.append("language", "en")
    url.searchParams.append("published_after", publishedAfter)
    url.searchParams.append("limit", "20")
    url.searchParams.append("sort", "published_at")
    url.searchParams.append("categories", "business,finance")

    const response = await fetch(url.toString(), {
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`News API responded with status ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      articles: data.data || [],
      total: data.meta?.found || 0,
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
