-- Fix inventory trigger to work with tenant-aware inventory
DROP TRIGGER IF EXISTS transaction_trigger ON transaction_history;
DROP FUNCTION IF EXISTS update_inventory();

CREATE OR REPLACE FUNCTION update_inventory()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO current_inventory (item_type, quantity, total_cost, avg_price, unit, tenant_id)
    VALUES (
        NEW.item_type,
        CASE
            WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.quantity
            ELSE -NEW.quantity
        END,
        CASE
            WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.total_cost
            ELSE 0
        END,
        CASE
            WHEN NEW.transaction_type IN ('Restocking', 'restock') AND NEW.quantity > 0
            THEN NEW.total_cost / NEW.quantity
            ELSE 0
        END,
        COALESCE(
            (SELECT unit FROM current_inventory WHERE item_type = NEW.item_type AND tenant_id = NEW.tenant_id),
            'kg'
        ),
        NEW.tenant_id
    )
    ON CONFLICT (item_type, tenant_id)
    DO UPDATE SET
        quantity = current_inventory.quantity +
            CASE
                WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.quantity
                ELSE -NEW.quantity
            END,
        total_cost = GREATEST(0, current_inventory.total_cost +
            CASE
                WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.total_cost
                ELSE -(NEW.quantity * CASE
                    WHEN current_inventory.quantity > 0 THEN current_inventory.total_cost / current_inventory.quantity
                    ELSE 0
                END)
            END),
        avg_price = CASE
            WHEN (current_inventory.quantity +
                CASE
                    WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.quantity
                    ELSE -NEW.quantity
                END) > 0
            THEN (GREATEST(0, current_inventory.total_cost +
                CASE
                    WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.total_cost
                    ELSE -(NEW.quantity * CASE
                        WHEN current_inventory.quantity > 0 THEN current_inventory.total_cost / current_inventory.quantity
                        ELSE 0
                    END)
                END)) / (current_inventory.quantity +
                CASE
                    WHEN NEW.transaction_type IN ('Restocking', 'restock') THEN NEW.quantity
                    ELSE -NEW.quantity
                END)
            ELSE 0
        END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_trigger
    AFTER INSERT ON transaction_history
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory();
