import { type NextRequest, NextResponse } from "next/server"
import { getAllTransactions, getAllInventoryItems } from "@/lib/storage"

export async function POST(request: NextRequest) {
  try {
    console.log("AI Analysis Mock API called")

    const body = await request.json()
    console.log("Request body:", body)
    const { analysisType, timeframe = "30" } = body

    // Get current inventory and transactions
    console.log("Fetching inventory and transactions...")
    const inventory = await getAllInventoryItems()
    const transactions = await getAllTransactions()

    console.log(`Found ${inventory.length} inventory items and ${transactions.length} transactions`)

    // Generate mock analysis based on type
    let analysis = ""

    switch (analysisType) {
      case "inventory_overview":
        analysis = `
# Inventory Health Assessment

## Overall Status
Your inventory appears to be in good condition with adequate stock levels for most items. There are a few items that require attention.

## Items Running Low
- UREA: Current level (7130 kg) is below recommended minimum (8000 kg)
- Zinc: Current level (10 L) is critically low, reorder immediately
- Solubor: Current level (2 kg) is critically low, reorder immediately

## Most Active Items
1. MOP (Muriate of Potash)
2. DAP (Diammonium Phosphate)
3. UREA

## Unusual Patterns
- Noticed spike in Phosphoric Acid usage in the last 2 weeks
- Glycil consumption has decreased by 30% compared to previous period

## Recommendations
1. Implement minimum stock level alerts for critical items
2. Consider bulk ordering for frequently used items like MOP and UREA
3. Review storage conditions for liquid chemicals to extend shelf life
4. Schedule regular inventory audits to maintain accuracy
`
        break

      case "usage_trends":
        analysis = `
# Usage Trend Analysis

## Fastest Depleting Items
1. MOP (Muriate of Potash): 120 kg/week
2. UREA: 95 kg/week
3. DAP: 75 kg/week

## Seasonal Patterns
- Fertilizer usage increases by 40% during planting season (March-April)
- Pesticide consumption peaks during monsoon months (June-August)
- Winter months show 25% reduction in overall consumption

## Irregular Usage
- Phosphoric Acid: Unusual 60% spike in usage last month
- Tricel: Usage pattern is erratic and unpredictable
- MgSO4: Usage has been declining steadily over the past 3 months

## Predicted Stock-out Dates
- UREA: Will deplete in approximately 10 weeks at current usage rate
- Zinc: Critical - will deplete within 2 weeks
- Solubor: Critical - will deplete within 3 weeks

## Planning Recommendations
1. Increase UREA order by 20% before planting season
2. Implement just-in-time ordering for pesticides during monsoon
3. Consider reducing winter inventory by 15% to optimize carrying costs
4. Establish usage thresholds to trigger automatic reordering
`
        break

      case "reorder_suggestions":
        analysis = `
# Reorder Recommendations

## Critical Priority (Order Immediately)
1. Zinc (10 L remaining): Order 30 L
2. Solubor (2 kg remaining): Order 10 kg
3. NPK Potassium Nitrate (50 kg remaining): Order 150 kg

## Moderate Priority (Order Within 2 Weeks)
1. UREA (7130 kg remaining): Order 3000 kg
2. Tricel (35 L remaining): Order 25 L
3. Contaf (20 L remaining): Order 15 L

## Suggested Quantities
- MOP: 2000 kg (3-month supply)
- DAP: 1500 kg (3-month supply)
- Phosphoric Acid: 30 L (4-month supply)

## Overstocked Items
1. MOP white (13200 kg): Consider using before ordering more
2. MgSO4 (3475 kg): Usage rate doesn't justify current stock level
3. Glycil (120 L): Current stock exceeds 6-month requirement

## Optimal Timing
- Place bulk orders for fertilizers in January (pre-planting season)
- Order pesticides monthly during growing season
- Schedule quarterly orders for slow-moving items
`
        break

      case "cost_optimization":
        analysis = `
# Cost Optimization Analysis

## Excessive Stock Concerns
1. MOP white (13200 kg): Carrying cost estimated at $1,320/month
2. MgSO4 (3475 kg): Occupying premium storage space unnecessarily
3. Glycil (120 L): Shelf life concerns with current quantity

## Bulk Purchasing Opportunities
1. UREA: 10% discount available on 5000+ kg orders
2. DAP: Consider joining cooperative purchase program for 15% savings
3. Pesticides: Supplier offering volume discounts on quarterly orders

## Irregular Usage Optimization
1. Phosphoric Acid: Switch to smaller, more frequent orders to reduce waste
2. Tricel: Implement better application protocols to reduce consumption
3. Contaf: Consider alternative products with longer shelf life

## Waste Reduction Strategies
1. Improve storage conditions for liquid chemicals to prevent degradation
2. Train staff on proper measuring and application techniques
3. Implement FIFO (First In, First Out) inventory management
4. Consider weather-resistant storage for sensitive materials

## Inventory Turnover Insights
- Current average turnover: 4.2 times/year
- Industry benchmark: 6 times/year
- Recommendation: Reduce order quantities by 20% and increase frequency
`
        break

      default:
        return NextResponse.json({ success: false, error: "Invalid analysis type" }, { status: 400 })
    }

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      analysis,
      analysisType,
      timeframe: Number.parseInt(timeframe),
      dataPoints: {
        inventoryItems: inventory.length,
        recentTransactions: transactions.length,
        totalTransactions: transactions.length,
      },
    })
  } catch (error) {
    console.error("AI Analysis Mock error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate mock analysis",
      },
      { status: 500 },
    )
  }
}
