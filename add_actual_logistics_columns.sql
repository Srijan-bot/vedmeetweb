-- Add Actual Logistics Timestamps
-- precise recording of when events actually happened, separate from scheduled times.

DO $$
BEGIN
    -- 1. Actual Pickup (When status -> Shipped)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'actual_pickup') THEN
        ALTER TABLE orders ADD COLUMN actual_pickup TIMESTAMP WITH TIME ZONE;
    END IF;

    -- 2. Actual Delivery (When status -> Delivered)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'actual_delivery') THEN
        ALTER TABLE orders ADD COLUMN actual_delivery TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
