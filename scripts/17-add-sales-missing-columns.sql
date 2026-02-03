-- Add missing columns to sales_records table
-- This migration adds weight_kgs and price_per_kg columns that are required by the database

ALTER TABLE sales_records 
ADD COLUMN IF NOT EXISTS weight_kgs DECIMAL(10,2) DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS price_per_kg DECIMAL(10,2) DEFAULT 0 NOT NULL;

-- Update existing records to set weight_kgs = kgs_received and calculate price_per_kg
UPDATE sales_records 
SET weight_kgs = COALESCE(kgs_received, 0),
    price_per_kg = CASE 
      WHEN COALESCE(kgs_received, 0) > 0 THEN revenue / kgs_received 
      ELSE 0 
    END
WHERE weight_kgs IS NULL OR price_per_kg IS NULL;
