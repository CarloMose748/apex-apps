-- Bins Table for Customer Bin Assignment
-- Add this to your Supabase SQL editor after the main schema.sql

-- Bins table to track customer bin assignments
CREATE TABLE IF NOT EXISTS bins (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    bin_serial_number VARCHAR(50) UNIQUE NOT NULL,
    bin_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'large', 'small', 'commercial'
    bin_size_liters INTEGER, -- bin capacity in liters
    bin_status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'maintenance', 'lost', 'damaged'
    assigned_date TIMESTAMPTZ DEFAULT NOW(),
    assigned_by VARCHAR(255), -- admin email who assigned the bin
    last_collection_date TIMESTAMPTZ,
    next_scheduled_collection TIMESTAMPTZ,
    collection_frequency VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'bi-weekly', 'monthly'
    location_notes TEXT, -- specific location instructions (e.g., "behind garage", "front gate")
    special_instructions TEXT, -- any special handling instructions
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bin collection history table to track pickups
CREATE TABLE IF NOT EXISTS bin_collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bin_id UUID NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    driver_id UUID REFERENCES drivers(id),
    collection_date TIMESTAMPTZ DEFAULT NOW(),
    collection_status VARCHAR(20) DEFAULT 'completed', -- 'scheduled', 'completed', 'missed', 'cancelled'
    collection_type VARCHAR(30) DEFAULT 'regular', -- 'regular', 'emergency', 'extra'
    waste_amount_kg DECIMAL(6,2), -- estimated weight in kg
    waste_type VARCHAR(50), -- 'household', 'recyclable', 'organic', 'hazardous'
    collection_notes TEXT,
    photo_urls TEXT[], -- array of photo URLs if driver takes photos
    customer_satisfaction INTEGER CHECK (customer_satisfaction >= 1 AND customer_satisfaction <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bin maintenance table to track repairs and servicing
CREATE TABLE IF NOT EXISTS bin_maintenance (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    bin_id UUID NOT NULL REFERENCES bins(id) ON DELETE CASCADE,
    maintenance_type VARCHAR(30) NOT NULL, -- 'repair', 'cleaning', 'replacement', 'inspection'
    maintenance_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    reported_by VARCHAR(255), -- who reported the issue (customer email, driver email, admin email)
    assigned_to VARCHAR(255), -- maintenance personnel email
    issue_description TEXT,
    resolution_notes TEXT,
    maintenance_cost DECIMAL(8,2),
    scheduled_date TIMESTAMPTZ,
    completed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bins_customer_id ON bins(customer_id);
CREATE INDEX IF NOT EXISTS idx_bins_serial_number ON bins(bin_serial_number);
CREATE INDEX IF NOT EXISTS idx_bins_status ON bins(bin_status);
CREATE INDEX IF NOT EXISTS idx_bins_assigned_date ON bins(assigned_date);
CREATE INDEX IF NOT EXISTS idx_bins_next_collection ON bins(next_scheduled_collection);

CREATE INDEX IF NOT EXISTS idx_bin_collections_bin_id ON bin_collections(bin_id);
CREATE INDEX IF NOT EXISTS idx_bin_collections_customer_id ON bin_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_bin_collections_driver_id ON bin_collections(driver_id);
CREATE INDEX IF NOT EXISTS idx_bin_collections_date ON bin_collections(collection_date);
CREATE INDEX IF NOT EXISTS idx_bin_collections_status ON bin_collections(collection_status);

CREATE INDEX IF NOT EXISTS idx_bin_maintenance_bin_id ON bin_maintenance(bin_id);
CREATE INDEX IF NOT EXISTS idx_bin_maintenance_status ON bin_maintenance(maintenance_status);
CREATE INDEX IF NOT EXISTS idx_bin_maintenance_scheduled_date ON bin_maintenance(scheduled_date);

-- Function to get customer bins with collection info
CREATE OR REPLACE FUNCTION get_customer_bins(p_customer_id UUID)
RETURNS TABLE(
    bin_id UUID,
    bin_serial_number VARCHAR,
    bin_type VARCHAR,
    bin_status VARCHAR,
    assigned_date TIMESTAMPTZ,
    last_collection_date TIMESTAMPTZ,
    next_scheduled_collection TIMESTAMPTZ,
    collection_frequency VARCHAR,
    total_collections BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as bin_id,
        b.bin_serial_number,
        b.bin_type,
        b.bin_status,
        b.assigned_date,
        b.last_collection_date,
        b.next_scheduled_collection,
        b.collection_frequency,
        COALESCE(COUNT(bc.id), 0) as total_collections
    FROM bins b
    LEFT JOIN bin_collections bc ON b.id = bc.bin_id AND bc.collection_status = 'completed'
    WHERE b.customer_id = p_customer_id
    GROUP BY b.id
    ORDER BY b.assigned_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get bins due for collection
CREATE OR REPLACE FUNCTION get_bins_due_for_collection(p_days_ahead INTEGER DEFAULT 1)
RETURNS TABLE(
    bin_id UUID,
    customer_id UUID,
    customer_name VARCHAR,
    customer_phone VARCHAR,
    customer_address TEXT,
    bin_serial_number VARCHAR,
    bin_type VARCHAR,
    collection_frequency VARCHAR,
    next_scheduled_collection TIMESTAMPTZ,
    location_notes TEXT,
    special_instructions TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id as bin_id,
        c.id as customer_id,
        c.full_name as customer_name,
        c.phone_number as customer_phone,
        c.address as customer_address,
        b.bin_serial_number,
        b.bin_type,
        b.collection_frequency,
        b.next_scheduled_collection,
        b.location_notes,
        b.special_instructions
    FROM bins b
    JOIN customers c ON b.customer_id = c.id
    WHERE b.bin_status = 'active'
    AND c.verification_status = 'approved'
    AND b.next_scheduled_collection <= NOW() + INTERVAL '%s days'
    ORDER BY b.next_scheduled_collection ASC;
END;
$$ LANGUAGE plpgsql;

-- Function to update next collection date based on frequency
CREATE OR REPLACE FUNCTION update_next_collection_date(p_bin_id UUID, p_collection_date TIMESTAMPTZ DEFAULT NOW())
RETURNS VOID AS $$
DECLARE
    v_frequency VARCHAR(20);
    v_next_date TIMESTAMPTZ;
BEGIN
    -- Get the current collection frequency
    SELECT collection_frequency INTO v_frequency FROM bins WHERE id = p_bin_id;
    
    -- Calculate next collection date based on frequency
    CASE v_frequency
        WHEN 'daily' THEN v_next_date := p_collection_date + INTERVAL '1 day';
        WHEN 'weekly' THEN v_next_date := p_collection_date + INTERVAL '1 week';
        WHEN 'bi-weekly' THEN v_next_date := p_collection_date + INTERVAL '2 weeks';
        WHEN 'monthly' THEN v_next_date := p_collection_date + INTERVAL '1 month';
        ELSE v_next_date := p_collection_date + INTERVAL '1 week'; -- default to weekly
    END CASE;
    
    -- Update the bin with new collection dates
    UPDATE bins 
    SET 
        last_collection_date = p_collection_date,
        next_scheduled_collection = v_next_date,
        updated_at = NOW()
    WHERE id = p_bin_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bins_updated_at BEFORE UPDATE ON bins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bin_maintenance_updated_at BEFORE UPDATE ON bin_maintenance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing (optional)
/*
-- Uncomment and modify as needed for testing
INSERT INTO bins (customer_id, bin_serial_number, bin_type, bin_size_liters, assigned_by, collection_frequency, location_notes) VALUES
('customer-uuid-here', 'BIN001', 'standard', 120, 'admin@apexdriver.com', 'weekly', 'Front gate, blue bin'),
('customer-uuid-here', 'BIN002', 'large', 240, 'admin@apexdriver.com', 'bi-weekly', 'Back yard, near garage');
*/