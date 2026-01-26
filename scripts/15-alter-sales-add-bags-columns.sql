-- Add bags_sent and kgs_sent columns to sales_records table
-- bags_sent = number of bags dispatched
-- kgs_sent = auto-calculated as bags_sent * 50
-- weight_kgs = actual kgs received (renamed conceptually but keeping column name)

ALTER TABLE sales_records 
ADD COLUMN IF NOT EXISTS bags_sent INTEGER DEFAULT 0;

ALTER TABLE sales_records 
ADD COLUMN IF NOT EXISTS kgs_sent DECIMAL(10,2) DEFAULT 0;

-- Update existing records to have sensible defaults
-- Assuming weight_kgs was the received amount, we'll set bags_sent and kgs_sent to match
UPDATE sales_records 
SET bags_sent = CEIL(weight_kgs / 50),
    kgs_sent = CEIL(weight_kgs / 50) * 50
WHERE bags_sent = 0 OR bags_sent IS NULL;
