"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Brain, TrendingUp, Package, DollarSign, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface AnalysisResult {
  success: boolean
  analysis: string
  analysisType: string
  timeframe: number
  dataPoints: {
    inventoryItems: number
    recentTransactions: number
    totalTransactions: number
  }
}

export default function AIAnalysisPanel() {
  const [loading, setLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [analysisType, setAnalysisType] = useState("inventory_overview")
  const [timeframe, setTimeframe] = useState("30")

  const analysisTypes = [
    {
      value: "inventory_overview",
      label: "Inventory Overview",
      description: "General health and status analysis",
      icon: Package,
    },
    {
      value: "usage_trends",
      label: "Usage Trends",
      description: "Consumption patterns and forecasting",
      icon: TrendingUp,
    },
    {
      value: "reorder_suggestions",
      label: "Reorder Suggestions",
      description: "Smart restocking recommendations",
      icon: AlertTriangle,
    },
    {
      value: "cost_optimization",
      label: "Cost Optimization",
      description: "Efficiency and cost-saving insights",
      icon: DollarSign,
    },
  ]

  const timeframeOptions = [
    { value: "7", label: "Last 7 days" },
    { value: "14", label: "Last 2 weeks" },
    { value: "30", label: "Last 30 days" },
    { value: "60", label: "Last 2 months" },
    { value: "90", label: "Last 3 months" },
  ]

  const handleAnalysis = async () => {
    setLoading(true)

    try {
      const response = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          analysisType,
          timeframe,
        }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Analysis failed")
      }

      setAnalysisResult(result)

      toast({
        title: "Analysis Complete",
        description: "AI analysis has been generated successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Analysis error:", error)
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to generate analysis",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedAnalysisType = analysisTypes.find((type) => type.value === analysisType)
  const IconComponent = selectedAnalysisType?.icon || Brain

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            AI Inventory Analysis
          </CardTitle>
          <CardDescription>
            Get AI-powered insights about your inventory patterns, usage trends, and optimization opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Analysis Type</label>
              <Select value={analysisType} onValueChange={setAnalysisType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select analysis type" />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Time Period</label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {timeframeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleAnalysis} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <IconComponent className="mr-2 h-4 w-4" />
                Generate Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconComponent className="h-5 w-5 text-blue-600" />
              {selectedAnalysisType?.label} Results
            </CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{analysisResult.timeframe} days</Badge>
              <Badge variant="outline">{analysisResult.dataPoints.inventoryItems} items</Badge>
              <Badge variant="outline">{analysisResult.dataPoints.recentTransactions} recent transactions</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{analysisResult.analysis}</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
