import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"

const SENSORS_KEY = "farm:sensors"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId") || "default"
    const sensorId = params.id

    const sensorsData = await kv.get(`${SENSORS_KEY}:${tenantId}`)
    const sensors = sensorsData ? JSON.parse(sensorsData as string) : []

    const sensor = sensors.find((s: any) => s.id === sensorId)
    if (!sensor) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 })
    }

    return NextResponse.json({ sensor })
  } catch (error) {
    console.error("Error fetching sensor:", error)
    return NextResponse.json({ error: "Failed to fetch sensor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId") || "default"
    const sensorId = params.id
    const updateData = await request.json()

    const sensorsData = await kv.get(`${SENSORS_KEY}:${tenantId}`)
    const sensors = sensorsData ? JSON.parse(sensorsData as string) : []

    const sensorIndex = sensors.findIndex((s: any) => s.id === sensorId)
    if (sensorIndex === -1) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 })
    }

    // Update sensor
    sensors[sensorIndex] = { ...sensors[sensorIndex], ...updateData, updatedAt: new Date() }
    await kv.set(`${SENSORS_KEY}:${tenantId}`, JSON.stringify(sensors))

    return NextResponse.json({ sensor: sensors[sensorIndex] })
  } catch (error) {
    console.error("Error updating sensor:", error)
    return NextResponse.json({ error: "Failed to update sensor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get("tenantId") || "default"
    const sensorId = params.id

    const sensorsData = await kv.get(`${SENSORS_KEY}:${tenantId}`)
    const sensors = sensorsData ? JSON.parse(sensorsData as string) : []

    const filteredSensors = sensors.filter((s: any) => s.id !== sensorId)
    if (filteredSensors.length === sensors.length) {
      return NextResponse.json({ error: "Sensor not found" }, { status: 404 })
    }

    await kv.set(`${SENSORS_KEY}:${tenantId}`, JSON.stringify(filteredSensors))
    return NextResponse.json({ message: "Sensor deleted successfully" })
  } catch (error) {
    console.error("Error deleting sensor:", error)
    return NextResponse.json({ error: "Failed to delete sensor" }, { status: 500 })
  }
}
