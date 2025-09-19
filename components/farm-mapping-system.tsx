"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Zap,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  Activity,
  BarChart3,
  Map,
  Navigation,
  Maximize,
  Minimize,
  RotateCcw,
  Download,
  Sprout,
  Home,
  Tractor,
  Warehouse,
} from "lucide-react"

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

interface Zone {
  id: string
  name: string
  type: "field" | "greenhouse" | "storage" | "processing" | "office" | "equipment"
  area: number // in square meters
  coordinates: { x: number; y: number; width: number; height: number }
  color: string
  crops?: string[]
  sensors: string[]
  description?: string
  status: "active" | "inactive" | "maintenance"
}

interface MapLayer {
  id: string
  name: string
  type: "satellite" | "terrain" | "zones" | "sensors" | "irrigation" | "paths"
  visible: boolean
  opacity: number
}

const sampleSensors: Sensor[] = [
  {
    id: "temp-001",
    name: "North Field Temperature",
    type: "temperature",
    location: { x: 150, y: 100, zone: "north-field" },
    status: "online",
    batteryLevel: 85,
    lastReading: { value: 24.5, unit: "°C", timestamp: new Date() },
    thresholds: { min: 10, max: 35, optimal: { min: 18, max: 28 } },
    installDate: new Date("2024-01-15"),
    lastMaintenance: new Date("2024-11-01"),
  },
  {
    id: "humid-001",
    name: "Greenhouse 1 Humidity",
    type: "humidity",
    location: { x: 300, y: 200, zone: "greenhouse-1" },
    status: "online",
    batteryLevel: 92,
    lastReading: { value: 68, unit: "%", timestamp: new Date() },
    thresholds: { min: 40, max: 80, optimal: { min: 60, max: 75 } },
    installDate: new Date("2024-02-01"),
  },
  {
    id: "soil-001",
    name: "South Field Soil Moisture",
    type: "soil-moisture",
    location: { x: 200, y: 350, zone: "south-field" },
    status: "warning",
    batteryLevel: 45,
    lastReading: { value: 35, unit: "%", timestamp: new Date(Date.now() - 30 * 60 * 1000) },
    thresholds: { min: 20, max: 80, optimal: { min: 40, max: 70 } },
    installDate: new Date("2024-01-20"),
    lastMaintenance: new Date("2024-10-15"),
  },
  {
    id: "ph-001",
    name: "West Field pH Sensor",
    type: "ph",
    location: { x: 80, y: 250, zone: "west-field" },
    status: "offline",
    batteryLevel: 12,
    lastReading: { value: 6.8, unit: "pH", timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    thresholds: { min: 5.5, max: 8.0, optimal: { min: 6.0, max: 7.5 } },
    installDate: new Date("2024-03-01"),
  },
]

const sampleZones: Zone[] = [
  {
    id: "north-field",
    name: "North Field",
    type: "field",
    area: 5000,
    coordinates: { x: 50, y: 50, width: 200, height: 150 },
    color: "#22c55e",
    crops: ["Tomatoes", "Peppers"],
    sensors: ["temp-001"],
    description: "Main vegetable production area",
    status: "active",
  },
  {
    id: "greenhouse-1",
    name: "Greenhouse 1",
    type: "greenhouse",
    area: 800,
    coordinates: { x: 280, y: 180, width: 80, height: 60 },
    color: "#3b82f6",
    crops: ["Lettuce", "Herbs"],
    sensors: ["humid-001"],
    description: "Climate-controlled growing environment",
    status: "active",
  },
  {
    id: "south-field",
    name: "South Field",
    type: "field",
    area: 4200,
    coordinates: { x: 100, y: 300, width: 180, height: 120 },
    color: "#eab308",
    crops: ["Corn", "Beans"],
    sensors: ["soil-001"],
    description: "Seasonal crop rotation area",
    status: "active",
  },
  {
    id: "west-field",
    name: "West Field",
    type: "field",
    area: 3500,
    coordinates: { x: 20, y: 200, width: 120, height: 100 },
    color: "#f97316",
    crops: ["Wheat"],
    sensors: ["ph-001"],
    description: "Grain production area",
    status: "maintenance",
  },
  {
    id: "storage",
    name: "Storage Facility",
    type: "storage",
    area: 400,
    coordinates: { x: 380, y: 100, width: 60, height: 40 },
    color: "#6b7280",
    sensors: [],
    description: "Equipment and harvest storage",
    status: "active",
  },
]

const mapLayers: MapLayer[] = [
  { id: "satellite", name: "Satellite View", type: "satellite", visible: false, opacity: 100 },
  { id: "terrain", name: "Terrain", type: "terrain", visible: true, opacity: 100 },
  { id: "zones", name: "Farm Zones", type: "zones", visible: true, opacity: 80 },
  { id: "sensors", name: "Sensors", type: "sensors", visible: true, opacity: 100 },
  { id: "irrigation", name: "Irrigation", type: "irrigation", visible: false, opacity: 70 },
  { id: "paths", name: "Access Paths", type: "paths", visible: false, opacity: 60 },
]

export default function FarmMappingSystem() {
  const [sensors, setSensors] = useState<Sensor[]>(sampleSensors)
  const [zones, setZones] = useState<Zone[]>(sampleZones)
  const [layers, setLayers] = useState<MapLayer[]>(mapLayers)
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [isAddSensorOpen, setIsAddSensorOpen] = useState(false)
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false)
  const [mapScale, setMapScale] = useState(1)
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 })
  const [activeTab, setActiveTab] = useState("map")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const mapRef = useRef<HTMLDivElement>(null)

  const getSensorIcon = (type: Sensor["type"]) => {
    switch (type) {
      case "temperature":
        return Thermometer
      case "humidity":
        return Droplets
      case "soil-moisture":
        return Droplets
      case "ph":
        return Activity
      case "light":
        return Sun
      case "wind":
        return Wind
      case "rain":
        return Droplets
      case "pressure":
        return BarChart3
      default:
        return MapPin
    }
  }

  const getZoneIcon = (type: Zone["type"]) => {
    switch (type) {
      case "field":
        return Sprout
      case "greenhouse":
        return Home
      case "storage":
        return Warehouse
      case "processing":
        return Settings
      case "office":
        return Home
      case "equipment":
        return Tractor
      default:
        return MapPin
    }
  }

  const getSensorStatusColor = (status: Sensor["status"]) => {
    switch (status) {
      case "online":
        return "text-green-600"
      case "warning":
        return "text-yellow-600"
      case "error":
        return "text-red-600"
      case "offline":
        return "text-gray-400"
      default:
        return "text-gray-400"
    }
  }

  const getBatteryColor = (level: number) => {
    if (level > 60) return "text-green-600"
    if (level > 30) return "text-yellow-600"
    return "text-red-600"
  }

  const isReadingOptimal = (sensor: Sensor) => {
    const { value } = sensor.lastReading
    const { optimal } = sensor.thresholds
    return value >= optimal.min && value <= optimal.max
  }

  const filteredSensors = sensors.filter((sensor) => {
    if (filterStatus !== "all" && sensor.status !== filterStatus) return false
    if (filterType !== "all" && sensor.type !== filterType) return false
    return true
  })

  const handleSensorClick = (sensor: Sensor) => {
    setSelectedSensor(sensor)
  }

  const handleZoneClick = (zone: Zone) => {
    setSelectedZone(zone)
  }

  const toggleLayer = (layerId: string) => {
    setLayers(layers.map((layer) => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer)))
  }

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(layers.map((layer) => (layer.id === layerId ? { ...layer, opacity } : layer)))
  }

  const zoomIn = () => {
    setMapScale(Math.min(mapScale * 1.2, 3))
  }

  const zoomOut = () => {
    setMapScale(Math.max(mapScale / 1.2, 0.5))
  }

  const resetView = () => {
    setMapScale(1)
    setMapOffset({ x: 0, y: 0 })
  }

  const SensorMarker = ({ sensor }: { sensor: Sensor }) => {
    const SensorIcon = getSensorIcon(sensor.type)
    const statusColor = getSensorStatusColor(sensor.status)

    return (
      <div
        className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-110 ${
          selectedSensor?.id === sensor.id ? "z-20 scale-125" : "z-10"
        }`}
        style={{
          left: sensor.location.x * mapScale + mapOffset.x,
          top: sensor.location.y * mapScale + mapOffset.y,
        }}
        onClick={() => handleSensorClick(sensor)}
      >
        <div
          className={`relative p-2 bg-white rounded-full shadow-lg border-2 ${
            selectedSensor?.id === sensor.id ? "border-primary" : "border-gray-200"
          }`}
        >
          <SensorIcon className={`h-4 w-4 ${statusColor}`} />
          {sensor.status === "warning" && (
            <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
          )}
          {sensor.status === "error" && <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-red-500" />}
          {sensor.status === "offline" && <WifiOff className="absolute -top-1 -right-1 h-3 w-3 text-gray-400" />}
        </div>
      </div>
    )
  }

  const ZoneArea = ({ zone }: { zone: Zone }) => {
    const ZoneIcon = getZoneIcon(zone.type)

    return (
      <div
        className={`absolute cursor-pointer transition-all hover:opacity-80 ${
          selectedZone?.id === zone.id ? "ring-2 ring-primary ring-offset-2" : ""
        }`}
        style={{
          left: zone.coordinates.x * mapScale + mapOffset.x,
          top: zone.coordinates.y * mapScale + mapOffset.y,
          width: zone.coordinates.width * mapScale,
          height: zone.coordinates.height * mapScale,
          backgroundColor: zone.color,
          opacity: zone.status === "maintenance" ? 0.5 : 0.3,
        }}
        onClick={() => handleZoneClick(zone)}
      >
        <div className="absolute top-2 left-2 bg-white rounded p-1 shadow">
          <ZoneIcon className="h-3 w-3" />
        </div>
        <div className="absolute bottom-2 left-2 bg-white/90 rounded px-2 py-1 text-xs font-medium">{zone.name}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Farm Mapping & Sensors</h1>
          <p className="text-muted-foreground">Monitor your farm with interactive maps and real-time sensors</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Map
          </Button>
          <Button onClick={() => setIsAddSensorOpen(true)} size="sm">
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
                <p className="text-sm text-muted-foreground">Total Sensors</p>
                <p className="text-2xl font-bold text-primary">{sensors.length}</p>
              </div>
              <Activity className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">
                  {sensors.filter((s) => s.status === "online").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {sensors.filter((s) => s.status === "warning").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Farm Zones</p>
                <p className="text-2xl font-bold text-primary">{zones.length}</p>
              </div>
              <Map className="h-8 w-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="map">Interactive Map</TabsTrigger>
          <TabsTrigger value="sensors">Sensor List</TabsTrigger>
          <TabsTrigger value="zones">Zone Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Map Controls */}
            <div className="lg:col-span-1 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Map Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={zoomIn}>
                      <Maximize className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={zoomOut}>
                      <Minimize className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={resetView}>
                      <RotateCcw className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground">Zoom: {Math.round(mapScale * 100)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Map Layers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {layers.map((layer) => (
                    <div key={layer.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium cursor-pointer" onClick={() => toggleLayer(layer.id)}>
                          <input
                            type="checkbox"
                            checked={layer.visible}
                            onChange={() => toggleLayer(layer.id)}
                            className="mr-2"
                          />
                          {layer.name}
                        </label>
                      </div>
                      {layer.visible && (
                        <div className="ml-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Opacity:</span>
                            <input
                              type="range"
                              min="10"
                              max="100"
                              value={layer.opacity}
                              onChange={(e) => updateLayerOpacity(layer.id, Number(e.target.value))}
                              className="flex-1 h-1"
                            />
                            <span className="text-xs text-muted-foreground w-8">{layer.opacity}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Status</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                        <SelectItem value="offline">Offline</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Type</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="temperature">Temperature</SelectItem>
                        <SelectItem value="humidity">Humidity</SelectItem>
                        <SelectItem value="soil-moisture">Soil Moisture</SelectItem>
                        <SelectItem value="ph">pH</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="wind">Wind</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interactive Map */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-0">
                  <div
                    ref={mapRef}
                    className="relative w-full h-[600px] bg-gradient-to-br from-green-50 to-green-100 overflow-hidden rounded-lg"
                    style={{
                      backgroundImage: layers.find((l) => l.id === "terrain" && l.visible)
                        ? "url('/farm-terrain-aerial-view.jpg')"
                        : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {/* Zone Areas */}
                    {layers.find((l) => l.id === "zones")?.visible &&
                      zones.map((zone) => <ZoneArea key={zone.id} zone={zone} />)}

                    {/* Sensor Markers */}
                    {layers.find((l) => l.id === "sensors")?.visible &&
                      filteredSensors.map((sensor) => <SensorMarker key={sensor.id} sensor={sensor} />)}

                    {/* Map Scale Indicator */}
                    <div className="absolute bottom-4 left-4 bg-white/90 rounded px-2 py-1 text-xs">
                      Scale: 1:{Math.round(1000 / mapScale)}
                    </div>

                    {/* Compass */}
                    <div className="absolute top-4 right-4 bg-white/90 rounded-full p-2">
                      <Navigation className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Selected Sensor/Zone Details */}
          {(selectedSensor || selectedZone) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedSensor ? `Sensor: ${selectedSensor.name}` : `Zone: ${selectedZone?.name}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSensor && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Current Reading</h4>
                      <div className="text-2xl font-bold text-primary">
                        {selectedSensor.lastReading.value} {selectedSensor.lastReading.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {selectedSensor.lastReading.timestamp.toLocaleString()}
                      </div>
                      <Badge
                        className={`mt-2 ${
                          isReadingOptimal(selectedSensor)
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {isReadingOptimal(selectedSensor) ? "Optimal" : "Outside Range"}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Status & Battery</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={getSensorStatusColor(selectedSensor.status)}>{selectedSensor.status}</Badge>
                          {selectedSensor.status === "online" && <Wifi className="h-4 w-4 text-green-600" />}
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className={`h-4 w-4 ${getBatteryColor(selectedSensor.batteryLevel)}`} />
                          <span className="text-sm">{selectedSensor.batteryLevel}%</span>
                          <Progress value={selectedSensor.batteryLevel} className="flex-1 h-2" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Thresholds</h4>
                      <div className="text-sm space-y-1">
                        <div>
                          Min: {selectedSensor.thresholds.min} {selectedSensor.lastReading.unit}
                        </div>
                        <div>
                          Max: {selectedSensor.thresholds.max} {selectedSensor.lastReading.unit}
                        </div>
                        <div className="text-green-600">
                          Optimal: {selectedSensor.thresholds.optimal.min}-{selectedSensor.thresholds.optimal.max}{" "}
                          {selectedSensor.lastReading.unit}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {selectedZone && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Zone Details</h4>
                      <div className="space-y-1 text-sm">
                        <div>Type: {selectedZone.type}</div>
                        <div>Area: {selectedZone.area} m²</div>
                        <div>Status: {selectedZone.status}</div>
                        {selectedZone.description && <div>Description: {selectedZone.description}</div>}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Crops</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedZone.crops?.map((crop) => (
                          <Badge key={crop} variant="outline" className="text-xs">
                            {crop}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Sensors</h4>
                      <div className="text-sm">
                        {selectedZone.sensors.length} sensor(s) installed
                        <div className="mt-1">
                          {selectedZone.sensors.map((sensorId) => {
                            const sensor = sensors.find((s) => s.id === sensorId)
                            return sensor ? (
                              <Badge key={sensorId} variant="outline" className="text-xs mr-1">
                                {sensor.name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sensors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSensors.map((sensor) => {
              const SensorIcon = getSensorIcon(sensor.type)
              return (
                <Card key={sensor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <SensorIcon className={`h-4 w-4 ${getSensorStatusColor(sensor.status)}`} />
                        <h4 className="font-medium text-sm">{sensor.name}</h4>
                      </div>
                      <Badge className={getSensorStatusColor(sensor.status)}>{sensor.status}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-lg font-bold text-primary">
                        {sensor.lastReading.value} {sensor.lastReading.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sensor.lastReading.timestamp.toLocaleString()}
                      </div>

                      <div className="flex items-center gap-2">
                        <Zap className={`h-3 w-3 ${getBatteryColor(sensor.batteryLevel)}`} />
                        <Progress value={sensor.batteryLevel} className="flex-1 h-1" />
                        <span className="text-xs">{sensor.batteryLevel}%</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{sensor.location.zone}</span>
                      </div>

                      <Badge
                        className={`text-xs ${
                          isReadingOptimal(sensor) ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {isReadingOptimal(sensor) ? "Optimal" : "Outside Range"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => {
              const ZoneIcon = getZoneIcon(zone.type)
              return (
                <Card key={zone.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <ZoneIcon className="h-4 w-4 text-primary" />
                        <h4 className="font-medium text-sm">{zone.name}</h4>
                      </div>
                      <Badge variant={zone.status === "active" ? "default" : "secondary"}>{zone.status}</Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Type: {zone.type} • Area: {zone.area} m²
                      </div>

                      {zone.crops && zone.crops.length > 0 && (
                        <div>
                          <div className="text-xs font-medium mb-1">Crops:</div>
                          <div className="flex flex-wrap gap-1">
                            {zone.crops.map((crop) => (
                              <Badge key={crop} variant="outline" className="text-xs">
                                {crop}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">{zone.sensors.length} sensor(s) installed</div>

                      {zone.description && <div className="text-xs text-muted-foreground">{zone.description}</div>}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sensor Health Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Online Sensors</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(sensors.filter((s) => s.status === "online").length / sensors.length) * 100}
                        className="w-20 h-2"
                      />
                      <span className="text-sm font-medium">
                        {sensors.filter((s) => s.status === "online").length}/{sensors.length}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average Battery</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={sensors.reduce((acc, s) => acc + s.batteryLevel, 0) / sensors.length}
                        className="w-20 h-2"
                      />
                      <span className="text-sm font-medium">
                        {Math.round(sensors.reduce((acc, s) => acc + s.batteryLevel, 0) / sensors.length)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Optimal Readings</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={(sensors.filter(isReadingOptimal).length / sensors.length) * 100}
                        className="w-20 h-2"
                      />
                      <span className="text-sm font-medium">
                        {sensors.filter(isReadingOptimal).length}/{sensors.length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Zone Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {zones.map((zone) => (
                    <div key={zone.id} className="flex justify-between items-center">
                      <span className="text-sm">{zone.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {zone.sensors.length} sensors
                        </Badge>
                        <Badge variant={zone.status === "active" ? "default" : "secondary"} className="text-xs">
                          {zone.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
