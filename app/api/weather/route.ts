import { type NextRequest, NextResponse } from "next/server"

const FORECAST_DAYS = "8"

export async function GET(request: NextRequest) {
  const apiKey = process.env.WEATHERAPI_API_KEY

  if (!apiKey) {
    console.error("WEATHERAPI_API_KEY environment variable not set.")
    return NextResponse.json({ error: "Weather service not configured. API key is missing." }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const city = searchParams.get("city") || "Kodagu"

  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=${FORECAST_DAYS}&aqi=no&alerts=no`

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Revalidate every hour
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error from WeatherAPI.com:", errorData)
      const errorMessage = errorData?.error?.message || response.statusText
      return NextResponse.json({ error: `Failed to fetch weather data: ${errorMessage}` }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching weather data:", error)
    return NextResponse.json({ error: "An internal error occurred while fetching weather data." }, { status: 500 })
  }
}
