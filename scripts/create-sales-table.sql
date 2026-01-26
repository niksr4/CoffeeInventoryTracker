-- Create sales_records table in dispatch database
-- This table tracks coffee sales with bags sent, kgs sent (bags x 50), and kgs received

CREATE TABLE IF NOT EXISTS sales_records (
    id SERIAL PRIMARY KEY,
    sale_date DATE NOT NULL,
    coffee_type VARCHAR(50) NOT NULL,
    bag_type VARCHAR(50) NOT NULL,
    bags_sent INTEGER NOT NULL DEFAULT 0,
    kgs_sent DECIMAL(10,2) NOT NULL DEFAULT 0,
    kgs_received DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_per_kg DECIMAL(10,2) NOT NULL,
    total_revenue DECIMAL(12,2) NOT NULL,
    buyer_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for date-based queries
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales_records(sale_date);

-- Create index for coffee type filtering
CREATE INDEX IF NOT EXISTS idx_sales_coffee_type ON sales_records(coffee_type);
