import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"

interface Sensor {
  id: string
  name: string
  type: "temperature" | "humidity" | "soil-moisture" | "ph" | "light" | "wind" | "rain" | "pressure"
  location: { x: number; y: number; zone: string }
  status: "online" | "offline" | "warning" | "error"
  batteryLevel: number
  lastReading: {
    value: number
    unit: string
    timestamp: Date
  }
  thresholds: {
    min: number
    max: number
    optimal: { min: number; max: number }
  }
  installDate: Date
  lastMaintenance?: Date
}

const SENSORS_KEY = "farm:sensors"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId") || "default"
    const status = searchParams.get("status")
    const type = searchParams.get("type")
    const zone = searchParams.get("zone")

    const sensorsData = await kv.get(`${SENSORS_KEY}:${tenantId}`)
    let sensors: Sensor[] = sensorsData ? JSON.parse(sensorsData as string) : []

    // Apply filters
    if (status && status !== "all") {
      sensors = sensors.filter((sensor) => sensor.status === status)
    }
    if (type && type !== "all") {
      sensors = sensors.filter((sensor) => sensor.type === type)
    }
    if (zone && zone !== "all") {
      sensors = sensors.filter((sensor) => sensor.location.zone === zone)
    }

    return NextResponse.json({ sensors })
  } catch (error) {
    console.error("Error fetching sensors:", error)
    return NextResponse.json({ error: "Failed to fetch sensors" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId") || "default"

    const sensorData = await request.json()

    // Validate required fields
    if (!sensorData.name || !sensorData.type || !sensorData.location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newSensor: Sensor = {
      id: `sensor-${Date.now()}`,
      name: sensorData.name,
      type: sensorData.type,
      location: sensorData.location,
      status: "offline", // New sensors start offline until first reading
      batteryLevel: 100, // Assume full battery for new sensors
      lastReading: {
        value: 0,
        unit: getSensorUnit(sensorData.type),
        timestamp: new Date(),
      },
      thresholds: sensorData.thresholds || getDefaultThresholds(sensorData.type),
      installDate: new Date(),
      ...sensorData,
    }

    // Get existing sensors
    const existingSensorsData = await kv.get(`${SENSORS_KEY}:${tenantId}`)
    const existingSensors: Sensor[] = existingSensorsData ? JSON.parse(existingSensorsData as string) : []

    // Add new sensor
    const updatedSensors = [...existingSensors, newSensor]
    await kv.set(`${SENSORS_KEY}:${tenantId}`, JSON.stringify(updatedSensors))

    return NextResponse.json({ sensor: newSensor }, { status: 201 })
  } catch (error) {
    console.error("Error creating sensor:", error)
    return NextResponse.json({ error: "Failed to create sensor" }, { status: 500 })
  }
}

function getSensorUnit(type: string): string {
  switch (type) {
    case "temperature":
      return "°C"
    case "humidity":
    case "soil-moisture":
      return "%"
    case "ph":
      return "pH"
    case "light":
      return "lux"
    case "wind":
      return "km/h"
    case "rain":
      return "mm"
    case "pressure":
      return "hPa"
    default:
      return ""
  }
}

function getDefaultThresholds(type: string) {
  switch (type) {
    case "temperature":
      return { min: 5, max: 40, optimal: { min: 18, max: 28 } }
    case "humidity":
      return { min: 30, max: 90, optimal: { min: 50, max: 70 } }
    case "soil-moisture":
      return { min: 20, max: 80, optimal: { min: 40, max: 70 } }
    case "ph":
      return { min: 4.0, max: 9.0, optimal: { min: 6.0, max: 7.5 } }
    case "light":
      return { min: 0, max: 100000, optimal: { min: 10000, max: 50000 } }
    case "wind":
      return { min: 0, max: 100, optimal: { min: 5, max: 25 } }
    case "rain":
      return { min: 0, max: 200, optimal: { min: 10, max: 50 } }
    case "pressure":
      return { min: 900, max: 1100, optimal: { min: 1000, max: 1030 } }
    default:
      return { min: 0, max: 100, optimal: { min: 20, max: 80 } }
  }
}
