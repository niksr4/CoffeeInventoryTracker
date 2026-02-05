-- Migration: Rename all dry_p columns to dry_parchment
-- This script renames columns in processing_records and pepper_records tables

-- Processing Records Table
ALTER TABLE processing_records 
  RENAME COLUMN dry_p_todate TO dry_parchment_todate;

ALTER TABLE processing_records 
  RENAME COLUMN dry_p_bags TO dry_parchment_bags;

ALTER TABLE processing_records 
  RENAME COLUMN dry_p_bags_todate TO dry_parchment_bags_todate;

-- Pepper Records Table
ALTER TABLE pepper_records 
  RENAME COLUMN dry_p_todate TO dry_parchment_todate;

ALTER TABLE pepper_records 
  RENAME COLUMN dry_p_bags TO dry_parchment_bags;

ALTER TABLE pepper_records 
  RENAME COLUMN dry_p_bags_todate TO dry_parchment_bags_todate;

-- Inventory Batches Table (if it has these columns)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_batches' AND column_name = 'arabica_dry_p_bags') THEN
    ALTER TABLE inventory_batches RENAME COLUMN arabica_dry_p_bags TO arabica_dry_parchment_bags;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory_batches' AND column_name = 'robusta_dry_p_bags') THEN
    ALTER TABLE inventory_batches RENAME COLUMN robusta_dry_p_bags TO robusta_dry_parchment_bags;
  END IF;
END $$;

-- Inventory Table (if it has these columns)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory' AND column_name = 'arabica_dry_p_bags') THEN
    ALTER TABLE inventory RENAME COLUMN arabica_dry_p_bags TO arabica_dry_parchment_bags;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'inventory' AND column_name = 'robusta_dry_p_bags') THEN
    ALTER TABLE inventory RENAME COLUMN robusta_dry_p_bags TO robusta_dry_parchment_bags;
  END IF;
END $$;
