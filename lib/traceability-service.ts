// Supply Chain Traceability Service
// Handles all traceability operations for honey farm inventory

export interface Batch {
  id: string
  batchNumber: string
  productType: string
  sourceHiveId?: string
  harvestDate: string
  quantityInitial: number
  quantityCurrent: number
  unit: string
  status: "active" | "processing" | "packaged" | "shipped" | "sold" | "recalled"
  qualityGrade?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface QualityCheckpoint {
  id: string
  batchId: string
  checkpointType: "harvest" | "extraction" | "filtering" | "packaging" | "storage" | "shipping"
  inspectorName: string
  inspectionDate: string
  temperature?: number
  humidity?: number
  phLevel?: number
  moistureContent?: number
  colorGrade?: string
  tasteNotes?: string
  visualInspection?: string
  passed: boolean
  issuesFound?: string
  correctiveActions?: string
  createdAt: string
}

export interface ProcessingStep {
  id: string
  batchId: string
  stepType: "extraction" | "filtering" | "heating" | "cooling" | "blending" | "packaging"
  stepDate: string
  operatorName: string
  equipmentUsed?: string
  temperature?: number
  durationMinutes?: number
  inputQuantity?: number
  outputQuantity?: number
  yieldPercentage?: number
  notes?: string
  createdAt: string
}

export interface PackagingRecord {
  id: string
  batchId: string
  packageDate: string
  packageType: string
  packageSize: number
  packageUnit: string
  packagesCreated: number
  totalQuantity: number
  labelInfo?: string
  expiryDate?: string
  operatorName: string
  createdAt: string
}

export interface Shipment {
  id: string
  batchId: string
  customerName: string
  customerContact?: string
  shipDate: string
  quantityShipped: number
  unit: string
  trackingNumber?: string
  carrier?: string
  destinationAddress?: string
  deliveryDate?: string
  deliveryStatus: "shipped" | "in_transit" | "delivered" | "returned"
  createdAt: string
}

export interface Hive {
  id: string
  hiveNumber: string
  locationName: string
  gpsCoordinates?: string
  installationDate?: string
  hiveType?: string
  queenAgeMonths?: number
  lastInspectionDate?: string
  healthStatus: "healthy" | "weak" | "diseased" | "abandoned"
  notes?: string
  createdAt: string
}

export interface TraceabilityEvent {
  id: string
  batchId: string
  eventType: string
  eventDate: string
  description: string
  operatorName?: string
  location?: string
  metadata?: string
  createdAt: string
}

// Generate unique batch number
export function generateBatchNumber(): string {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const day = date.getDate().toString().padStart(2, "0")
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")
  return `B${year}${month}${day}-${random}`
}

// Generate unique IDs
export function generateId(prefix = ""): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${prefix}${timestamp}-${random}`
}

// Format date for display
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Format datetime for display
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Calculate batch yield percentage
export function calculateYield(inputQuantity: number, outputQuantity: number): number {
  if (inputQuantity === 0) return 0
  return Math.round((outputQuantity / inputQuantity) * 100 * 100) / 100
}

// Get status color for UI
export function getStatusColor(status: string): string {
  const colors: { [key: string]: string } = {
    active: "bg-green-100 text-green-800",
    processing: "bg-blue-100 text-blue-800",
    packaged: "bg-purple-100 text-purple-800",
    shipped: "bg-orange-100 text-orange-800",
    sold: "bg-gray-100 text-gray-800",
    recalled: "bg-red-100 text-red-800",
    healthy: "bg-green-100 text-green-800",
    weak: "bg-yellow-100 text-yellow-800",
    diseased: "bg-red-100 text-red-800",
    abandoned: "bg-gray-100 text-gray-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

// Validate batch data
export function validateBatch(batch: Partial<Batch>): string[] {
  const errors: string[] = []

  if (!batch.batchNumber?.trim()) {
    errors.push("Batch number is required")
  }

  if (!batch.productType?.trim()) {
    errors.push("Product type is required")
  }

  if (!batch.harvestDate) {
    errors.push("Harvest date is required")
  }

  if (!batch.quantityInitial || batch.quantityInitial <= 0) {
    errors.push("Initial quantity must be greater than 0")
  }

  if (!batch.unit?.trim()) {
    errors.push("Unit is required")
  }

  return errors
}

// Create traceability event
export function createTraceabilityEvent(
  batchId: string,
  eventType: string,
  description: string,
  operatorName?: string,
  location?: string,
  metadata?: any,
): TraceabilityEvent {
  return {
    id: generateId("evt-"),
    batchId,
    eventType,
    eventDate: new Date().toISOString(),
    description,
    operatorName,
    location,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
    createdAt: new Date().toISOString(),
  }
}
