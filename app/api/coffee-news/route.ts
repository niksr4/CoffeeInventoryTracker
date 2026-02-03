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
    const searchQuery = "(coffee india) OR (coffee arabica india) OR (coffee robusta india) OR (coffee demand) OR (coffee supply) OR (coffee production) OR (coffee trends) OR (coffee forecast) OR (coffee outlook) OR (coffee market analysis) OR (coffee consumption)"
    
    // Fetch articles from 2026 (3 articles)
    const url2026 = new URL("https://api.thenewsapi.com/v1/news/all")
    url2026.searchParams.append("api_token", apiKey)
    url2026.searchParams.append("search", searchQuery)
    url2026.searchParams.append("language", "en")
    url2026.searchParams.append("published_after", "2026-01-01")
    url2026.searchParams.append("limit", "5")
    url2026.searchParams.append("sort", "published_at")
    url2026.searchParams.append("categories", "business,finance")

    const response2026 = await fetch(url2026.toString(), {
      headers: {
        "Accept": "application/json",
      },
    })

    // Fetch articles from 2025 (7 articles)
    const url2025 = new URL("https://api.thenewsapi.com/v1/news/all")
    url2025.searchParams.append("api_token", apiKey)
    url2025.searchParams.append("search", searchQuery)
    url2025.searchParams.append("language", "en")
    url2025.searchParams.append("published_after", "2025-01-01")
    url2025.searchParams.append("published_before", "2025-12-31")
    url2025.searchParams.append("limit", "10")
    url2025.searchParams.append("sort", "published_at")
    url2025.searchParams.append("categories", "business,finance")

    const response2025 = await fetch(url2025.toString(), {
      headers: {
        "Accept": "application/json",
      },
    })

    if (!response2026.ok || !response2025.ok) {
      throw new Error(`News API responded with error`)
    }

    const data2026 = await response2026.json()
    const data2025 = await response2025.json()
    
    // Combine articles: 3 from 2026, 7 from 2025
    const articles2026 = (data2026.data || []).slice(0, 3)
    const articles2025 = (data2025.data || []).slice(0, 7)
    const allArticles = [...articles2026, ...articles2025]
    
    return NextResponse.json({
      articles: allArticles,
      total: allArticles.length,
      from2026: articles2026.length,
      from2025: articles2025.length,
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
