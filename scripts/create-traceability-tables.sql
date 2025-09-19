-- Supply Chain Traceability Database Schema
-- Creates tables for end-to-end tracking from hive to customer

-- Batches/Lots table - Core traceability unit
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  batch_number TEXT UNIQUE NOT NULL,
  product_type TEXT NOT NULL,
  source_hive_id TEXT,
  harvest_date DATE NOT NULL,
  quantity_initial DECIMAL(10,2) NOT NULL,
  quantity_current DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'processing', 'packaged', 'shipped', 'sold', 'recalled')),
  quality_grade TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quality Control Checkpoints
CREATE TABLE IF NOT EXISTS quality_checkpoints (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id),
  checkpoint_type TEXT NOT NULL CHECK (checkpoint_type IN ('harvest', 'extraction', 'filtering', 'packaging', 'storage', 'shipping')),
  inspector_name TEXT NOT NULL,
  inspection_date TIMESTAMP NOT NULL,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  ph_level DECIMAL(4,2),
  moisture_content DECIMAL(5,2),
  color_grade TEXT,
  taste_notes TEXT,
  visual_inspection TEXT,
  passed BOOLEAN NOT NULL,
  issues_found TEXT,
  corrective_actions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Processing Steps - Track what happens to each batch
CREATE TABLE IF NOT EXISTS processing_steps (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id),
  step_type TEXT NOT NULL CHECK (step_type IN ('extraction', 'filtering', 'heating', 'cooling', 'blending', 'packaging')),
  step_date TIMESTAMP NOT NULL,
  operator_name TEXT NOT NULL,
  equipment_used TEXT,
  temperature DECIMAL(5,2),
  duration_minutes INTEGER,
  input_quantity DECIMAL(10,2),
  output_quantity DECIMAL(10,2),
  yield_percentage DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Packaging Records
CREATE TABLE IF NOT EXISTS packaging_records (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id),
  package_date TIMESTAMP NOT NULL,
  package_type TEXT NOT NULL,
  package_size DECIMAL(10,2) NOT NULL,
  package_unit TEXT NOT NULL,
  packages_created INTEGER NOT NULL,
  total_quantity DECIMAL(10,2) NOT NULL,
  label_info TEXT,
  expiry_date DATE,
  operator_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id),
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  ship_date TIMESTAMP NOT NULL,
  quantity_shipped DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  tracking_number TEXT,
  carrier TEXT,
  destination_address TEXT,
  delivery_date TIMESTAMP,
  delivery_status TEXT DEFAULT 'shipped' CHECK (delivery_status IN ('shipped', 'in_transit', 'delivered', 'returned')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hive Information (source tracking)
CREATE TABLE IF NOT EXISTS hives (
  id TEXT PRIMARY KEY,
  hive_number TEXT UNIQUE NOT NULL,
  location_name TEXT NOT NULL,
  gps_coordinates TEXT,
  installation_date DATE,
  hive_type TEXT,
  queen_age_months INTEGER,
  last_inspection_date DATE,
  health_status TEXT DEFAULT 'healthy' CHECK (health_status IN ('healthy', 'weak', 'diseased', 'abandoned')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Traceability Events (audit trail)
CREATE TABLE IF NOT EXISTS traceability_events (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES batches(id),
  event_type TEXT NOT NULL,
  event_date TIMESTAMP NOT NULL,
  description TEXT NOT NULL,
  operator_name TEXT,
  location TEXT,
  metadata TEXT, -- JSON string for additional data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_batches_batch_number ON batches(batch_number);
CREATE INDEX IF NOT EXISTS idx_batches_harvest_date ON batches(harvest_date);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_quality_checkpoints_batch_id ON quality_checkpoints(batch_id);
CREATE INDEX IF NOT EXISTS idx_processing_steps_batch_id ON processing_steps(batch_id);
CREATE INDEX IF NOT EXISTS idx_packaging_records_batch_id ON packaging_records(batch_id);
CREATE INDEX IF NOT EXISTS idx_shipments_batch_id ON shipments(batch_id);
CREATE INDEX IF NOT EXISTS idx_traceability_events_batch_id ON traceability_events(batch_id);
CREATE INDEX IF NOT EXISTS idx_traceability_events_event_date ON traceability_events(event_date);

-- Insert sample hives
INSERT OR IGNORE INTO hives (id, hive_number, location_name, gps_coordinates, installation_date, hive_type, queen_age_months, health_status) VALUES
('hive-001', 'H001', 'North Field', '40.7128,-74.0060', '2024-03-15', 'Langstroth', 8, 'healthy'),
('hive-002', 'H002', 'South Field', '40.7589,-73.9851', '2024-03-20', 'Langstroth', 6, 'healthy'),
('hive-003', 'H003', 'East Meadow', '40.7505,-73.9934', '2024-04-01', 'Top Bar', 4, 'healthy'),
('hive-004', 'H004', 'West Grove', '40.7282,-73.9942', '2024-04-10', 'Langstroth', 3, 'weak');
