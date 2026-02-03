"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Newspaper, ExternalLink, AlertTriangle, TrendingUp, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface NewsArticle {
  uuid: string
  title: string
  description: string
  snippet: string
  url: string
  image_url: string
  published_at: string
  source: string
  categories: string[]
}

interface NewsResponse {
  articles: NewsArticle[]
  total: number
  from2026?: number
  from2025?: number
}

export default function NewsTab() {
  const [newsData, setNewsData] = useState<NewsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true)
        const response = await fetch("/api/coffee-news")
        
        if (!response.ok) {
          throw new Error("Failed to fetch coffee news")
        }
        
        const data = await response.json()
        setNewsData(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load coffee news")
        console.error("Error fetching coffee news:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase()
    if (cat.includes("business") || cat.includes("market")) return <TrendingUp className="h-3 w-3" />
    if (cat.includes("finance") || cat.includes("economic")) return <DollarSign className="h-3 w-3" />
    return null
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Coffee Market News
          </CardTitle>
          <CardDescription>
            Latest news on coffee in India, global demand, supply, production trends, and market forecasts
            {newsData && ` (${newsData.total} articles: ${newsData.from2026 || 0} from 2026, ${newsData.from2025 || 0} from 2025)`}
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {newsData?.articles && newsData.articles.length > 0 ? (
          newsData.articles.map((article) => (
            <Card key={article.uuid} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {article.image_url && (
                    <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-semibold leading-tight">{article.title}</h3>
                      <Badge variant="outline" className="flex-shrink-0">
                        {article.source}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{article.description || article.snippet}</p>
                    <div className="flex items-center justify-between gap-4 pt-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatDate(article.published_at)}</span>
                        {article.categories && article.categories.length > 0 && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(article.categories[0])}
                              <span>{article.categories[0]}</span>
                            </div>
                          </>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                          Read more
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-muted-foreground">No news articles found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
