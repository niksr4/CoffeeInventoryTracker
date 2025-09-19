import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"

const SENSORS_KEY = "farm:sensors"
const READINGS_KEY = "farm:sensor-readings"

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId") || "default"

    const readingData = await request.json()

    // Validate required fields
    if (!readingData.sensorId || readingData.value === undefined) {
      return NextResponse.json({ error: "Missing sensorId or value" }, { status: 400 })
    }

    // Get existing sensors
    const sensorsData = await kv.get(`${SENSORS_KEY}:${tenantId}`)
    const sensors = sensorsData ? JSON.parse(sensorsData as string) : []

    const sensorIndex = sensors.findIndex((s: any) => s.id === readingData.sensorId)
    if (sensorIndex === -1) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 })
    }

    const sensor = sensors[sensorIndex]
    const timestamp = new Date()

    // Update sensor with new reading
    const updatedReading = {
      value: readingData.value,
      unit: sensor.lastReading.unit,
      timestamp,
    }

    // Determine sensor status based on reading and thresholds
    let status = "online"
    if (readingData.value < sensor.thresholds.min || readingData.value > sensor.thresholds.max) {
      status = "warning"
    }
    if (readingData.batteryLevel !== undefined && readingData.batteryLevel < 20) {
      status = "warning"
    }

    sensors[sensorIndex] = {
      ...sensor,
      lastReading: updatedReading,
      status,
      batteryLevel: readingData.batteryLevel || sensor.batteryLevel,
    }

    // Save updated sensors
    await kv.set(`${SENSORS_KEY}:${tenantId}`, JSON.stringify(sensors))

    // Store historical reading
    const readingRecord = {
      id: `reading-${Date.now()}`,
      sensorId: readingData.sensorId,
      value: readingData.value,
      unit: sensor.lastReading.unit,
      timestamp,
      batteryLevel: readingData.batteryLevel,
      tenantId,
    }

    // Get existing readings for this sensor
    const existingReadingsData = await kv.get(`${READINGS_KEY}:${tenantId}:${readingData.sensorId}`)
    const existingReadings = existingReadingsData ? JSON.parse(existingReadingsData as string) : []

    // Add new reading and keep only last 1000 readings per sensor
    const updatedReadings = [readingRecord, ...existingReadings].slice(0, 1000)
    await kv.set(`${READINGS_KEY}:${tenantId}:${readingData.sensorId}`, JSON.stringify(updatedReadings))

    return NextResponse.json({
      message: "Reading recorded successfully",
      sensor: sensors[sensorIndex],
      reading: readingRecord,
    })
  } catch (error) {
    console.error("Error recording sensor reading:", error)
    return NextResponse.json({ error: "Failed to record reading" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId") || "default"
    const sensorId = searchParams.get("sensorId")
    const limit = Number.parseInt(searchParams.get("limit") || "100")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    if (!sensorId) {
      return NextResponse.json({ error: "sensorId is required" }, { status: 400 })
    }

    const readingsData = await kv.get(`${READINGS_KEY}:${tenantId}:${sensorId}`)
    let readings = readingsData ? JSON.parse(readingsData as string) : []

    // Apply date filters
    if (startDate) {
      const start = new Date(startDate)
      readings = readings.filter((r: any) => new Date(r.timestamp) >= start)
    }
    if (endDate) {
      const end = new Date(endDate)
      readings = readings.filter((r: any) => new Date(r.timestamp) <= end)
    }

    // Apply limit
    readings = readings.slice(0, limit)

    return NextResponse.json({ readings })
  } catch (error) {
    console.error("Error fetching sensor readings:", error)
    return NextResponse.json({ error: "Failed to fetch readings" }, { status: 500 })
  }
}
