"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Activity,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Gauge,
  TrendingUp,
  TrendingDown,
  Eye,
  Map,
  Navigation,
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface FarmZone {
  id: string
  name: string
  type: "field" | "greenhouse" | "storage" | "processing" | "livestock" | "orchard"
  area: number // in acres or square meters
  coordinates: { lat: number; lng: number }
  description: string
  crops?: string[]
  sensors: string[]
  status: "active" | "inactive" | "maintenance"
  lastUpdated: Date
}

interface Sensor {
  id: string
  name: string
  type: "temperature" | "humidity" | "soil_moisture" | "ph" | "light" | "wind" | "rain" | "pressure"
  zoneId: string
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
  location: { lat: number; lng: number }
}

interface SensorReading {
  id: string
  sensorId: string
  value: number
  timestamp: Date
  alert?: boolean
}

const sampleZones: FarmZone[] = [
  {
    id: "zone-1",
    name: "North Field",
    type: "field",
    area: 5.2,
    coordinates: { lat: 12.2958, lng: 76.6394 },
    description: "Main crop field for seasonal vegetables",
    crops: ["Tomatoes", "Peppers", "Cucumbers"],
    sensors: ["temp-1", "humid-1", "soil-1"],
    status: "active",
    lastUpdated: new Date(),
  },
  {
    id: "zone-2",
    name: "Greenhouse A",
    type: "greenhouse",
    area: 0.8,
    coordinates: { lat: 12.2968, lng: 76.6404 },
    description: "Climate-controlled greenhouse for premium crops",
    crops: ["Lettuce", "Herbs", "Microgreens"],
    sensors: ["temp-2", "humid-2", "light-1"],
    status: "active",
    lastUpdated: new Date(),
  },
  {
    id: "zone-3",
    name: "Storage Facility",
    type: "storage",
    area: 0.3,
    coordinates: { lat: 12.2948, lng: 76.6384 },
    description: "Post-harvest storage and processing area",
    sensors: ["temp-3", "humid-3"],
    status: "active",
    lastUpdated: new Date(),
  },
]

const sampleSensors: Sensor[] = [
  {
    id: "temp-1",
    name: "Temperature Sensor - North Field",
    type: "temperature",
    zoneId: "zone-1",
    status: "online",
    batteryLevel: 85,
    lastReading: {
      value: 24.5,
      unit: "°C",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
    },
    thresholds: {
      min: 10,
      max: 35,
      optimal: { min: 20, max: 28 },
    },
    location: { lat: 12.2958, lng: 76.6394 },
  },
  {
    id: "humid-1",
    name: "Humidity Sensor - North Field",
    type: "humidity",
    zoneId: "zone-1",
    status: "online",
    batteryLevel: 72,
    lastReading: {
      value: 65,
      unit: "%",
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
    },
    thresholds: {
      min: 30,
      max: 90,
      optimal: { min: 50, max: 70 },
    },
    location: { lat: 12.296, lng: 76.6396 },
  },
  {
    id: "soil-1",
    name: "Soil Moisture - North Field",
    type: "soil_moisture",
    zoneId: "zone-1",
    status: "warning",
    batteryLevel: 45,
    lastReading: {
      value: 35,
      unit: "%",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
    thresholds: {
      min: 20,
      max: 80,
      optimal: { min: 40, max: 60 },
    },
    location: { lat: 12.2956, lng: 76.6392 },
  },
  {
    id: "temp-2",
    name: "Temperature Sensor - Greenhouse A",
    type: "temperature",
    zoneId: "zone-2",
    status: "online",
    batteryLevel: 92,
    lastReading: {
      value: 26.8,
      unit: "°C",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
    },
    thresholds: {
      min: 15,
      max: 30,
      optimal: { min: 22, max: 26 },
    },
    location: { lat: 12.2968, lng: 76.6404 },
  },
]

export default function FarmMappingSystem() {
  const [zones, setZones] = useState<FarmZone[]>(sampleZones)
  const [sensors, setSensors] = useState<Sensor[]>(sampleSensors)
  const [selectedZone, setSelectedZone] = useState<FarmZone | null>(null)
  const [selectedSensor, setSensor] = useState<Sensor | null>(null)
  const [activeTab, setActiveTab] = useState("map")
  const [isAddZoneDialogOpen, setIsAddZoneDialogOpen] = useState(false)
  const [isAddSensorDialogOpen, setIsAddSensorDialogOpen] = useState(false)
  const [mapView, setMapView] = useState<"satellite" | "terrain" | "hybrid">("satellite")

  const [newZone, setNewZone] = useState<Partial<FarmZone>>({
    name: "",
    type: "field",
    area: 0,
    description: "",
    crops: [],
    status: "active",
  })

  const [newSensor, setNewSensor] = useState<Partial<Sensor>>({
    name: "",
    type: "temperature",
    zoneId: "",
    batteryLevel: 100,
    status: "online",
  })

  const getSensorIcon = (type: Sensor["type"]) => {
    switch (type) {
      case "temperature":
        return Thermometer
      case "humidity":
        return Droplets
      case "soil_moisture":
        return Droplets
      case "ph":
        return Gauge
      case "light":
        return Sun
      case "wind":
        return Wind
      case "rain":
        return Droplets
      case "pressure":
        return Gauge
      default:
        return Activity
    }
  }

  const getZoneTypeColor = (type: FarmZone["type"]) => {
    switch (type) {
      case "field":
        return "bg-green-100 text-green-800 border-green-300"
      case "greenhouse":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "storage":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "processing":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "livestock":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "orchard":
        return "bg-pink-100 text-pink-800 border-pink-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getSensorStatusColor = (status: Sensor["status"]) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-800 border-green-300"
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "error":
        return "bg-red-100 text-red-800 border-red-300"
      case "offline":
        return "bg-gray-100 text-gray-800 border-gray-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const isReadingOptimal = (sensor: Sensor) => {
    const { value } = sensor.lastReading
    const { optimal } = sensor.thresholds
    return value >= optimal.min && value <= optimal.max
  }

  const isReadingCritical = (sensor: Sensor) => {
    const { value } = sensor.lastReading
    const { min, max } = sensor.thresholds
    return value < min || value > max
  }

  const getReadingTrend = (sensorId: string) => {
    // In a real app, this would analyze historical data
    // For demo, we'll simulate trends
    const trends = ["up", "down", "stable"]
    return trends[Math.floor(Math.random() * trends.length)]
  }

  const handleAddZone = () => {
    if (!newZone.name || !newZone.area) {
      toast({
        title: "Missing fields",
        description: "Please fill in zone name and area",
        variant: "destructive",
      })
      return
    }

    const zone: FarmZone = {
      id: `zone-${Date.now()}`,
      name: newZone.name!,
      type: newZone.type!,
      area: newZone.area!,
      coordinates: { lat: 12.2958 + Math.random() * 0.01, lng: 76.6394 + Math.random() * 0.01 },
      description: newZone.description || "",
      crops: newZone.crops || [],
      sensors: [],
      status: newZone.status!,
      lastUpdated: new Date(),
    }

    setZones([...zones, zone])
    setIsAddZoneDialogOpen(false)
    setNewZone({
      name: "",
      type: "field",
      area: 0,
      description: "",
      crops: [],
      status: "active",
    })

    toast({
      title: "Zone added",
      description: "New farm zone has been created successfully",
    })
  }

  const handleAddSensor = () => {
    if (!newSensor.name || !newSensor.zoneId) {
      toast({
        title: "Missing fields",
        description: "Please fill in sensor name and select a zone",
        variant: "destructive",
      })
      return
    }

    const sensor: Sensor = {
      id: `sensor-${Date.now()}`,
      name: newSensor.name!,
      type: newSensor.type!,
      zoneId: newSensor.zoneId!,
      status: newSensor.status!,
      batteryLevel: newSensor.batteryLevel!,
      lastReading: {
        value: Math.random() * 50 + 10,
        unit: newSensor.type === "temperature" ? "°C" : newSensor.type === "humidity" ? "%" : "units",
        timestamp: new Date(),
      },
      thresholds: {
        min: 10,
        max: 50,
        optimal: { min: 20, max: 40 },
      },
      location: { lat: 12.2958 + Math.random() * 0.01, lng: 76.6394 + Math.random() * 0.01 },
    }

    setSensors([...sensors, sensor])

    // Update zone to include this sensor
    setZones(
      zones.map((zone) => (zone.id === newSensor.zoneId ? { ...zone, sensors: [...zone.sensors, sensor.id] } : zone)),
    )

    setIsAddSensorDialogOpen(false)
    setNewSensor({
      name: "",
      type: "temperature",
      zoneId: "",
      batteryLevel: 100,
      status: "online",
    })

    toast({
      title: "Sensor added",
      description: "New sensor has been added successfully",
    })
  }

  const activeSensors = sensors.filter((s) => s.status === "online").length
  const warningSensors = sensors.filter((s) => s.status === "warning" || s.status === "error").length
  const offlineSensors = sensors.filter((s) => s.status === "offline").length
  const criticalReadings = sensors.filter(isReadingCritical).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Farm Mapping & Sensors</h1>
          <p className="text-muted-foreground">Monitor your farm zones and sensor network in real-time</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddZoneDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Zone
          </Button>
          <Button onClick={() => setIsAddSensorDialogOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Sensor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Zones</p>
                <p className="text-2xl font-bold text-primary">{zones.filter((z) => z.status === "active").length}</p>
              </div>
              <Map className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online Sensors</p>
                <p className="text-2xl font-bold text-green-600">{activeSensors}</p>
              </div>
              <Wifi className="h-8 w-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">{warningSensors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{criticalReadings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="map">Farm Map</TabsTrigger>
          <TabsTrigger value="zones">Zone Management</TabsTrigger>
          <TabsTrigger value="sensors">Sensor Network</TabsTrigger>
          <TabsTrigger value="monitoring">Live Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Interactive Farm Map</CardTitle>
                <div className="flex gap-2">
                  <Select value={mapView} onValueChange={(value: any) => setMapView(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="satellite">Satellite</SelectItem>
                      <SelectItem value="terrain">Terrain</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Navigation className="h-4 w-4 mr-2" />
                    Center Map
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Simulated Map View */}
              <div className="relative bg-green-50 rounded-lg h-96 border-2 border-dashed border-green-200 flex items-center justify-center">
                <div className="text-center">
                  <Map className="h-16 w-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-700 mb-2">Interactive Map View</h3>
                  <p className="text-green-600 mb-4">
                    In a production environment, this would show a real interactive map with:
                  </p>
                  <div className="text-sm text-green-600 space-y-1">
                    <p>• Zone boundaries and labels</p>
                    <p>• Sensor locations with real-time status</p>
                    <p>• Satellite/terrain imagery</p>
                    <p>• Weather overlay data</p>
                    <p>• Task locations and routes</p>
                  </div>
                </div>
              </div>

              {/* Map Legend */}
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm">Active Zones</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm">Greenhouses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm">Storage Areas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Critical Sensors</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Normal Sensors</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zones.map((zone) => (
              <Card key={zone.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{zone.name}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge className={getZoneTypeColor(zone.type)}>{zone.type}</Badge>
                        <Badge variant={zone.status === "active" ? "default" : "secondary"}>{zone.status}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedZone(zone)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Area:</span>
                      <span>{zone.area} acres</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sensors:</span>
                      <span>{zone.sensors.length} active</span>
                    </div>
                    {zone.crops && zone.crops.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Crops:</p>
                        <div className="flex flex-wrap gap-1">
                          {zone.crops.map((crop) => (
                            <Badge key={crop} variant="outline" className="text-xs">
                              {crop}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">{zone.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sensors" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensors.map((sensor) => {
              const SensorIcon = getSensorIcon(sensor.type)
              const trend = getReadingTrend(sensor.id)
              const isOptimal = isReadingOptimal(sensor)
              const isCritical = isReadingCritical(sensor)

              return (
                <Card key={sensor.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <SensorIcon className="h-5 w-5 text-primary" />
                        <div>
                          <CardTitle className="text-base">{sensor.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {zones.find((z) => z.id === sensor.zoneId)?.name}
                          </p>
                        </div>
                      </div>
                      <Badge className={getSensorStatusColor(sensor.status)}>{sensor.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Current Reading */}
                      <div className="text-center">
                        <div
                          className={`text-2xl font-bold ${isCritical ? "text-red-600" : isOptimal ? "text-green-600" : "text-yellow-600"}`}
                        >
                          {sensor.lastReading.value}
                          {sensor.lastReading.unit}
                        </div>
                        <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                          {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                          {trend === "stable" && <Activity className="h-4 w-4 text-blue-500" />}
                          <span>{new Date(sensor.lastReading.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      {/* Optimal Range */}
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>
                            Range: {sensor.thresholds.min} - {sensor.thresholds.max}
                          </span>
                          <span>
                            Optimal: {sensor.thresholds.optimal.min} - {sensor.thresholds.optimal.max}
                          </span>
                        </div>
                        <Progress
                          value={
                            ((sensor.lastReading.value - sensor.thresholds.min) /
                              (sensor.thresholds.max - sensor.thresholds.min)) *
                            100
                          }
                          className="h-2"
                        />
                      </div>

                      {/* Battery Level */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {sensor.batteryLevel > 20 ? (
                            <Battery className="h-4 w-4 text-green-600" />
                          ) : (
                            <BatteryLow className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">Battery</span>
                        </div>
                        <span
                          className={`text-sm font-medium ${sensor.batteryLevel > 20 ? "text-green-600" : "text-red-600"}`}
                        >
                          {sensor.batteryLevel}%
                        </span>
                      </div>

                      {/* Connection Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {sensor.status === "online" ? (
                            <Wifi className="h-4 w-4 text-green-600" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">Connection</span>
                        </div>
                        <span
                          className={`text-sm font-medium ${sensor.status === "online" ? "text-green-600" : "text-red-600"}`}
                        >
                          {sensor.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sensors
                    .filter((sensor) => isReadingCritical(sensor) || sensor.status !== "online")
                    .map((sensor) => (
                      <div
                        key={sensor.id}
                        className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div>
                          <p className="font-medium text-red-800">{sensor.name}</p>
                          <p className="text-sm text-red-600">
                            {isReadingCritical(sensor)
                              ? `Critical reading: ${sensor.lastReading.value}${sensor.lastReading.unit}`
                              : `Sensor ${sensor.status}`}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" className="text-red-600 border-red-300 bg-transparent">
                          View
                        </Button>
                      </div>
                    ))}
                  {sensors.filter((sensor) => isReadingCritical(sensor) || sensor.status !== "online").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>All systems operating normally</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Sensor Network</span>
                      <span>{Math.round((activeSensors / sensors.length) * 100)}% Online</span>
                    </div>
                    <Progress value={(activeSensors / sensors.length) * 100} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Data Quality</span>
                      <span>95% Good</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Battery Health</span>
                      <span>
                        {Math.round(sensors.reduce((acc, s) => acc + s.batteryLevel, 0) / sensors.length)}% Avg
                      </span>
                    </div>
                    <Progress
                      value={sensors.reduce((acc, s) => acc + s.batteryLevel, 0) / sensors.length}
                      className="h-2"
                    />
                  </div>

                  <div className="pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-green-600">{activeSensors}</p>
                        <p className="text-xs text-muted-foreground">Online</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-red-600">{offlineSensors}</p>
                        <p className="text-xs text-muted-foreground">Offline</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Zone Dialog */}
      <Dialog open={isAddZoneDialogOpen} onOpenChange={setIsAddZoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Farm Zone</DialogTitle>
            <DialogDescription>Create a new zone to organize your farm areas</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Zone Name</label>
              <Input
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="e.g., South Field, Greenhouse B"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Zone Type</label>
                <Select
                  value={newZone.type}
                  onValueChange={(value: FarmZone["type"]) => setNewZone({ ...newZone, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="field">Field</SelectItem>
                    <SelectItem value="greenhouse">Greenhouse</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="livestock">Livestock</SelectItem>
                    <SelectItem value="orchard">Orchard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Area (acres)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={newZone.area}
                  onChange={(e) => setNewZone({ ...newZone, area: Number(e.target.value) })}
                  placeholder="0.0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                value={newZone.description}
                onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                placeholder="Describe this zone..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddZoneDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddZone}>Add Zone</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Sensor Dialog */}
      <Dialog open={isAddSensorDialogOpen} onOpenChange={setIsAddSensorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sensor</DialogTitle>
            <DialogDescription>Deploy a new sensor to monitor your farm conditions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Sensor Name</label>
              <Input
                value={newSensor.name}
                onChange={(e) => setNewSensor({ ...newSensor, name: e.target.value })}
                placeholder="e.g., Temperature Sensor - East Side"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Sensor Type</label>
                <Select
                  value={newSensor.type}
                  onValueChange={(value: Sensor["type"]) => setNewSensor({ ...newSensor, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temperature">Temperature</SelectItem>
                    <SelectItem value="humidity">Humidity</SelectItem>
                    <SelectItem value="soil_moisture">Soil Moisture</SelectItem>
                    <SelectItem value="ph">pH Level</SelectItem>
                    <SelectItem value="light">Light Intensity</SelectItem>
                    <SelectItem value="wind">Wind Speed</SelectItem>
                    <SelectItem value="rain">Rainfall</SelectItem>
                    <SelectItem value="pressure">Air Pressure</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Zone</label>
                <Select
                  value={newSensor.zoneId}
                  onValueChange={(value) => setNewSensor({ ...newSensor, zoneId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSensorDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSensor}>Add Sensor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
