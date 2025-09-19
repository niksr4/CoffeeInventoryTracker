"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Thermometer,
  Droplets,
  Zap,
  Users,
  Target,
  MapPin,
  BookOpen,
  BarChart3,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
} from "lucide-react"

interface SensorReading {
  id: string
  name: string
  type: "temperature" | "humidity" | "moisture" | "ph" | "light"
  value: number
  unit: string
  status: "normal" | "warning" | "critical"
  lastUpdate: string
  location: string
  batteryLevel?: number
}

interface SystemAlert {
  id: string
  type: "warning" | "error" | "info"
  title: string
  message: string
  timestamp: string
  acknowledged: boolean
  source: "sensor" | "task" | "inventory" | "hr" | "system"
}

interface LiveMetric {
  id: string
  name: string
  value: number
  unit: string
  change: number
  changeType: "increase" | "decrease"
  status: "good" | "warning" | "critical"
  icon: any
}

export default function RealtimeMonitoringDashboard() {
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds

  // Mock real-time data - in production, this would come from WebSocket or API polling
  const [sensorReadings] = useState<SensorReading[]>([
    {
      id: "1",
      name: "Hive Temperature",
      type: "temperature",
      value: 35.2,
      unit: "°C",
      status: "normal",
      lastUpdate: "2024-01-25 14:30:15",
      location: "Hive Block A",
      batteryLevel: 85,
    },
    {
      id: "2",
      name: "Humidity Sensor",
      type: "humidity",
      value: 68,
      unit: "%",
      status: "warning",
      lastUpdate: "2024-01-25 14:29:45",
      location: "Hive Block B",
      batteryLevel: 45,
    },
    {
      id: "3",
      name: "Soil Moisture",
      type: "moisture",
      value: 42,
      unit: "%",
      status: "critical",
      lastUpdate: "2024-01-25 14:28:30",
      location: "Garden Area",
      batteryLevel: 92,
    },
  ])

  const [systemAlerts] = useState<SystemAlert[]>([
    {
      id: "1",
      type: "warning",
      title: "Low Battery Alert",
      message: "Humidity sensor in Hive Block B has low battery (45%)",
      timestamp: "2024-01-25 14:25:00",
      acknowledged: false,
      source: "sensor",
    },
    {
      id: "2",
      type: "error",
      title: "Critical Moisture Level",
      message: "Soil moisture in Garden Area is critically low (42%)",
      timestamp: "2024-01-25 14:20:00",
      acknowledged: false,
      source: "sensor",
    },
    {
      id: "3",
      type: "info",
      title: "Task Completed",
      message: "Honey harvest task completed by John Smith",
      timestamp: "2024-01-25 13:45:00",
      acknowledged: true,
      source: "task",
    },
  ])

  const [liveMetrics] = useState<LiveMetric[]>([
    {
      id: "1",
      name: "Active Hives",
      value: 24,
      unit: "hives",
      change: 2,
      changeType: "increase",
      status: "good",
      icon: Activity,
    },
    {
      id: "2",
      name: "Honey Production",
      value: 156.8,
      unit: "kg",
      change: -5.2,
      changeType: "decrease",
      status: "warning",
      icon: Droplets,
    },
    {
      id: "3",
      name: "Active Tasks",
      value: 12,
      unit: "tasks",
      change: 3,
      changeType: "increase",
      status: "good",
      icon: Target,
    },
    {
      id: "4",
      name: "Team Members",
      value: 8,
      unit: "online",
      change: 1,
      changeType: "increase",
      status: "good",
      icon: Users,
    },
  ])

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setLastUpdate(new Date())
      // In real app, this would trigger data refresh
    }, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal":
      case "good":
        return "text-green-600 bg-green-100"
      case "warning":
        return "text-yellow-600 bg-yellow-100"
      case "critical":
      case "error":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "normal":
      case "good":
        return <CheckCircle className="h-4 w-4" />
      case "warning":
        return <AlertTriangle className="h-4 w-4" />
      case "critical":
      case "error":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const getSensorIcon = (type: string) => {
    switch (type) {
      case "temperature":
        return <Thermometer className="h-5 w-5" />
      case "humidity":
        return <Droplets className="h-5 w-5" />
      case "moisture":
        return <Droplets className="h-5 w-5" />
      case "ph":
        return <Activity className="h-5 w-5" />
      case "light":
        return <Zap className="h-5 w-5" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const unacknowledgedAlerts = systemAlerts.filter((alert) => !alert.acknowledged)
  const criticalSensors = sensorReadings.filter((sensor) => sensor.status === "critical")
  const warningSensors = sensorReadings.filter((sensor) => sensor.status === "warning")

  return (
    <div className="space-y-6">
      {/* Connection Status & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {isConnected ? <Wifi className="h-5 w-5 text-green-600" /> : <WifiOff className="h-5 w-5 text-red-600" />}
            <span className={`text-sm font-medium ${isConnected ? "text-green-600" : "text-red-600"}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">Last update: {lastUpdate.toLocaleTimeString()}</div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setLastUpdate(new Date())}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant={autoRefresh ? "default" : "outline"} size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            Auto Refresh {autoRefresh ? "On" : "Off"}
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {unacknowledgedAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>
              {unacknowledgedAlerts.length} unacknowledged alert{unacknowledgedAlerts.length > 1 ? "s" : ""}
            </strong>
            {unacknowledgedAlerts.length > 0 && <span className="ml-2">Latest: {unacknowledgedAlerts[0].title}</span>}
          </AlertDescription>
        </Alert>
      )}

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {liveMetrics.map((metric) => {
          const IconComponent = metric.icon
          return (
            <Card key={metric.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`h-5 w-5 ${getStatusColor(metric.status).split(" ")[0]}`} />
                    <span className="text-sm font-medium text-muted-foreground">{metric.name}</span>
                  </div>
                  <Badge className={getStatusColor(metric.status)}>{getStatusIcon(metric.status)}</Badge>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">
                    {metric.value} {metric.unit}
                  </div>
                  <div className="flex items-center mt-1">
                    {metric.changeType === "increase" ? (
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm ${metric.changeType === "increase" ? "text-green-600" : "text-red-600"}`}>
                      {Math.abs(metric.change)} {metric.unit}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="sensors" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sensors">Sensors</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="sensors" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sensorReadings.map((sensor) => (
              <Card
                key={sensor.id}
                className={`border-l-4 ${
                  sensor.status === "critical"
                    ? "border-l-red-500"
                    : sensor.status === "warning"
                      ? "border-l-yellow-500"
                      : "border-l-green-500"
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getSensorIcon(sensor.type)}
                      <CardTitle className="text-lg">{sensor.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(sensor.status)}>
                      {getStatusIcon(sensor.status)}
                      <span className="ml-1 capitalize">{sensor.status}</span>
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>{sensor.location}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {sensor.value}
                      {sensor.unit}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Reading</div>
                  </div>

                  {sensor.batteryLevel && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Battery Level</span>
                        <span>{sensor.batteryLevel}%</span>
                      </div>
                      <Progress
                        value={sensor.batteryLevel}
                        className={`h-2 ${
                          sensor.batteryLevel < 20
                            ? "bg-red-100"
                            : sensor.batteryLevel < 50
                              ? "bg-yellow-100"
                              : "bg-green-100"
                        }`}
                      />
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">Last update: {sensor.lastUpdate}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="space-y-4">
            {systemAlerts.map((alert) => (
              <Alert
                key={alert.id}
                className={
                  alert.type === "error"
                    ? "border-red-200 bg-red-50"
                    : alert.type === "warning"
                      ? "border-yellow-200 bg-yellow-50"
                      : "border-blue-200 bg-blue-50"
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {alert.type === "error" ? (
                      <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    ) : alert.type === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    ) : (
                      <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold">{alert.title}</div>
                      <AlertDescription className="mt-1">{alert.message}</AlertDescription>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                        <span>{alert.timestamp}</span>
                        <Badge variant="outline" className="text-xs">
                          {alert.source}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {alert.acknowledged ? (
                      <Badge variant="secondary">Acknowledged</Badge>
                    ) : (
                      <Button size="sm" variant="outline">
                        Acknowledge
                      </Button>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  <span>Active Tasks</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">12</div>
                <p className="text-sm text-muted-foreground">Currently in progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Completed Today</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">8</div>
                <p className="text-sm text-muted-foreground">Tasks finished</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span>Overdue</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">3</div>
                <p className="text-sm text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>System Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Sensor Uptime</span>
                    <span>98.5%</span>
                  </div>
                  <Progress value={98.5} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Task Completion Rate</span>
                    <span>87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Training Progress</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Sensors</span>
                  <span className="font-semibold">{sensorReadings.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Critical Alerts</span>
                  <span className="font-semibold text-red-600">{criticalSensors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Warning Alerts</span>
                  <span className="font-semibold text-yellow-600">{warningSensors.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">System Health</span>
                  <Badge className="bg-green-100 text-green-800">Excellent</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
                <CardDescription>Real-time status of all farm management systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Sensor Network</span>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Online</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Task Management</span>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Training System</span>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">Running</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">HR Management</span>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">Active</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates across all systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sensor data updated</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Task completed by John</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Low battery alert</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Training module completed</p>
                      <p className="text-xs text-muted-foreground">3 hours ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
