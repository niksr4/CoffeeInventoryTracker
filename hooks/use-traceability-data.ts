"use client"

import { useState } from "react"
import type {
  Batch,
  QualityCheckpoint,
  ProcessingStep,
  PackagingRecord,
  Shipment,
  Hive,
  TraceabilityEvent,
} from "@/lib/traceability-service"

// Mock data for development - in production this would connect to your database
const mockBatches: Batch[] = [
  {
    id: "batch-001",
    batchNumber: "B241215-001",
    productType: "Wildflower Honey",
    sourceHiveId: "hive-001",
    harvestDate: "2024-12-01",
    quantityInitial: 50.0,
    quantityCurrent: 45.0,
    unit: "kg",
    status: "processing",
    qualityGrade: "Grade A",
    notes: "Excellent quality harvest from north field",
    createdAt: "2024-12-01T10:00:00Z",
    updatedAt: "2024-12-15T14:30:00Z",
  },
  {
    id: "batch-002",
    batchNumber: "B241210-002",
    productType: "Clover Honey",
    sourceHiveId: "hive-002",
    harvestDate: "2024-11-28",
    quantityInitial: 35.0,
    quantityCurrent: 35.0,
    unit: "kg",
    status: "packaged",
    qualityGrade: "Grade A",
    notes: "Light colored, mild flavor",
    createdAt: "2024-11-28T09:15:00Z",
    updatedAt: "2024-12-10T16:45:00Z",
  },
]

const mockHives: Hive[] = [
  {
    id: "hive-001",
    hiveNumber: "H001",
    locationName: "North Field",
    gpsCoordinates: "40.7128,-74.0060",
    installationDate: "2024-03-15",
    hiveType: "Langstroth",
    queenAgeMonths: 8,
    lastInspectionDate: "2024-12-10",
    healthStatus: "healthy",
    notes: "Strong colony, good honey production",
    createdAt: "2024-03-15T00:00:00Z",
  },
  {
    id: "hive-002",
    hiveNumber: "H002",
    locationName: "South Field",
    gpsCoordinates: "40.7589,-73.9851",
    installationDate: "2024-03-20",
    hiveType: "Langstroth",
    queenAgeMonths: 6,
    lastInspectionDate: "2024-12-08",
    healthStatus: "healthy",
    notes: "Moderate production, good health",
    createdAt: "2024-03-20T00:00:00Z",
  },
]

const mockQualityCheckpoints: QualityCheckpoint[] = [
  {
    id: "qc-001",
    batchId: "batch-001",
    checkpointType: "harvest",
    inspectorName: "John Smith",
    inspectionDate: "2024-12-01T10:30:00Z",
    temperature: 22.5,
    humidity: 65.0,
    moistureContent: 18.2,
    colorGrade: "Light Amber",
    tasteNotes: "Floral, mild sweetness",
    visualInspection: "Clear, no crystallization",
    passed: true,
    createdAt: "2024-12-01T10:30:00Z",
  },
  {
    id: "qc-002",
    batchId: "batch-001",
    checkpointType: "extraction",
    inspectorName: "Jane Doe",
    inspectionDate: "2024-12-02T14:15:00Z",
    temperature: 25.0,
    moistureContent: 17.8,
    passed: true,
    notes: "Extraction completed successfully",
    createdAt: "2024-12-02T14:15:00Z",
  },
]

export function useTraceabilityData() {
  const [batches, setBatches] = useState<Batch[]>(mockBatches)
  const [hives, setHives] = useState<Hive[]>(mockHives)
  const [qualityCheckpoints, setQualityCheckpoints] = useState<QualityCheckpoint[]>(mockQualityCheckpoints)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [packagingRecords, setPackagingRecords] = useState<PackagingRecord[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [traceabilityEvents, setTraceabilityEvents] = useState<TraceabilityEvent[]>([])
  const [loading, setLoading] = useState(false)

  // Add new batch
  const addBatch = (batch: Omit<Batch, "id" | "createdAt" | "updatedAt">) => {
    const newBatch: Batch = {
      ...batch,
      id: `batch-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setBatches((prev) => [newBatch, ...prev])
    return newBatch
  }

  // Update batch
  const updateBatch = (id: string, updates: Partial<Batch>) => {
    setBatches((prev) =>
      prev.map((batch) => (batch.id === id ? { ...batch, ...updates, updatedAt: new Date().toISOString() } : batch)),
    )
  }

  // Add quality checkpoint
  const addQualityCheckpoint = (checkpoint: Omit<QualityCheckpoint, "id" | "createdAt">) => {
    const newCheckpoint: QualityCheckpoint = {
      ...checkpoint,
      id: `qc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setQualityCheckpoints((prev) => [newCheckpoint, ...prev])
    return newCheckpoint
  }

  // Add processing step
  const addProcessingStep = (step: Omit<ProcessingStep, "id" | "createdAt">) => {
    const newStep: ProcessingStep = {
      ...step,
      id: `ps-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setProcessingSteps((prev) => [newStep, ...prev])
    return newStep
  }

  // Add packaging record
  const addPackagingRecord = (record: Omit<PackagingRecord, "id" | "createdAt">) => {
    const newRecord: PackagingRecord = {
      ...record,
      id: `pkg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setPackagingRecords((prev) => [newRecord, ...prev])
    return newRecord
  }

  // Add shipment
  const addShipment = (shipment: Omit<Shipment, "id" | "createdAt">) => {
    const newShipment: Shipment = {
      ...shipment,
      id: `ship-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    setShipments((prev) => [newShipment, ...prev])
    return newShipment
  }

  // Get batch by ID
  const getBatchById = (id: string) => {
    return batches.find((batch) => batch.id === id)
  }

  // Get hive by ID
  const getHiveById = (id: string) => {
    return hives.find((hive) => hive.id === id)
  }

  // Get quality checkpoints for batch
  const getQualityCheckpointsForBatch = (batchId: string) => {
    return qualityCheckpoints.filter((qc) => qc.batchId === batchId)
  }

  // Get processing steps for batch
  const getProcessingStepsForBatch = (batchId: string) => {
    return processingSteps.filter((ps) => ps.batchId === batchId)
  }

  // Get packaging records for batch
  const getPackagingRecordsForBatch = (batchId: string) => {
    return packagingRecords.filter((pr) => pr.batchId === batchId)
  }

  // Get shipments for batch
  const getShipmentsForBatch = (batchId: string) => {
    return shipments.filter((s) => s.batchId === batchId)
  }

  return {
    // Data
    batches,
    hives,
    qualityCheckpoints,
    processingSteps,
    packagingRecords,
    shipments,
    traceabilityEvents,
    loading,

    // Actions
    addBatch,
    updateBatch,
    addQualityCheckpoint,
    addProcessingStep,
    addPackagingRecord,
    addShipment,

    // Getters
    getBatchById,
    getHiveById,
    getQualityCheckpointsForBatch,
    getProcessingStepsForBatch,
    getPackagingRecordsForBatch,
    getShipmentsForBatch,
  }
}
