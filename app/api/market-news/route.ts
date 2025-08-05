import { type NextRequest, NextResponse } from "next/server"

const marketNews = [
  {
    id: "1",
    date: "01/08/2024",
    title: "Global Fertilizer Prices Increase",
    content: "Global fertilizer prices have increased due to supply chain disruptions.",
  },
  {
    id: "2",
    date: "02/08/2024",
    title: "New Pest Detected in South American Crops",
    content: "A new pest has been detected in South American crops, potentially affecting yields.",
  },
  {
    id: "3",
    date: "03/08/2024",
    title: "Favorable Weather Conditions in Key Growing Regions",
    content: "Key growing regions are experiencing favorable weather conditions, boosting crop prospects.",
  },
  {
    id: "4",
    date: "04/08/2024",
    title: "Government Announces New Subsidies for Farmers",
    content: "The government has announced new subsidies for farmers to support agricultural production.",
  },
  {
    id: "5",
    date: "05/08/2024",
    title: "Demand for Organic Produce Surges",
    content: "Demand for organic produce is surging, creating new opportunities for farmers.",
  },
]

export async function GET(request: NextRequest) {
  return NextResponse.json({ news: marketNews })
}
