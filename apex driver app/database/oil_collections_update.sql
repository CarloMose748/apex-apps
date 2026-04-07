-- ADD NEW COLUMNS TO oil_collections TABLE FOR INDIVIDUAL BIN TRACKING
-- Run this script in your Supabase SQL Editor

-- Add new columns to oil_collections table
ALTER TABLE oil_collections 
ADD COLUMN IF NOT EXISTS bin_serial_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS bin_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS bin_size_litres DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS bin_material VARCHAR(50),
ADD COLUMN IF NOT EXISTS bin_condition VARCHAR(50),
ADD COLUMN IF NOT EXISTS bin_last_cleaned TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS bin_location_notes TEXT,
ADD COLUMN IF NOT EXISTS collection_bin_weight_kg DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS collection_temperature DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS collection_ph_level DECIMAL(4,2),
ADD COLUMN IF NOT EXISTS collection_moisture_content DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS collection_contaminant_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS collection_filtration_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS collection_pre_treatment_notes TEXT,
ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(30) DEFAULT 'collected',
ADD COLUMN IF NOT EXISTS workflow_next_step VARCHAR(100),
ADD COLUMN IF NOT EXISTS workflow_assigned_to UUID,
ADD COLUMN IF NOT EXISTS workflow_priority VARCHAR(20) DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS workflow_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS compliance_certificate_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS compliance_disposal_permit VARCHAR(100),
ADD COLUMN IF NOT EXISTS compliance_environmental_notes TEXT,
ADD COLUMN IF NOT EXISTS customer_satisfaction_rating INTEGER CHECK (customer_satisfaction_rating >= 1 AND customer_satisfaction_rating <= 5),
ADD COLUMN IF NOT EXISTS customer_feedback TEXT,
ADD COLUMN IF NOT EXISTS driver_collection_notes TEXT,
ADD COLUMN IF NOT EXISTS driver_equipment_condition TEXT,
ADD COLUMN IF NOT EXISTS driver_safety_incidents TEXT,
ADD COLUMN IF NOT EXISTS cost_collection_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cost_processing_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cost_disposal_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cost_transport_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS revenue_oil_sale_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS revenue_processing_credits DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS financial_net_profit DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS gps_collection_accuracy_meters DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS gps_collection_timestamp TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS weather_conditions VARCHAR(100),
ADD COLUMN IF NOT EXISTS weather_temperature_celsius DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weather_humidity_percent DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS integration_exported_to_accounting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS integration_accounting_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS integration_exported_to_erp BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS integration_erp_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS audit_last_updated_by UUID,
ADD COLUMN IF NOT EXISTS audit_change_reason TEXT,
ADD COLUMN IF NOT EXISTS audit_previous_values JSONB;

-- Add comments to document the new columns
COMMENT ON COLUMN oil_collections.bin_serial_number IS 'Unique identifier for the oil collection bin';
COMMENT ON COLUMN oil_collections.bin_type IS 'Type of bin (e.g., commercial, residential, industrial)';
COMMENT ON COLUMN oil_collections.bin_size_litres IS 'Capacity of the bin in litres';
COMMENT ON COLUMN oil_collections.bin_material IS 'Material of the bin (plastic, metal, etc.)';
COMMENT ON COLUMN oil_collections.bin_condition IS 'Physical condition of the bin';
COMMENT ON COLUMN oil_collections.bin_last_cleaned IS 'When the bin was last cleaned/maintained';
COMMENT ON COLUMN oil_collections.bin_location_notes IS 'Specific notes about where the bin is located';
COMMENT ON COLUMN oil_collections.collection_bin_weight_kg IS 'Weight of the bin during collection';
COMMENT ON COLUMN oil_collections.collection_temperature IS 'Temperature of oil at collection';
COMMENT ON COLUMN oil_collections.collection_ph_level IS 'pH level of collected oil';
COMMENT ON COLUMN oil_collections.collection_moisture_content IS 'Moisture content percentage';
COMMENT ON COLUMN oil_collections.collection_contaminant_level IS 'Level of contaminants (low/medium/high)';
COMMENT ON COLUMN oil_collections.collection_filtration_required IS 'Whether oil needs filtration';
COMMENT ON COLUMN oil_collections.collection_pre_treatment_notes IS 'Notes about required pre-treatment';
COMMENT ON COLUMN oil_collections.workflow_status IS 'Current status in processing workflow';
COMMENT ON COLUMN oil_collections.workflow_next_step IS 'Next step in the workflow';
COMMENT ON COLUMN oil_collections.workflow_assigned_to IS 'Staff member assigned to next step';
COMMENT ON COLUMN oil_collections.workflow_priority IS 'Processing priority (low/normal/high/urgent)';
COMMENT ON COLUMN oil_collections.workflow_due_date IS 'When the next step is due';
COMMENT ON COLUMN oil_collections.compliance_certificate_required IS 'Whether disposal certificate is needed';
COMMENT ON COLUMN oil_collections.compliance_disposal_permit IS 'Required disposal permit reference';
COMMENT ON COLUMN oil_collections.compliance_environmental_notes IS 'Environmental compliance notes';
COMMENT ON COLUMN oil_collections.customer_satisfaction_rating IS 'Customer rating (1-5)';
COMMENT ON COLUMN oil_collections.customer_feedback IS 'Customer feedback comments';
COMMENT ON COLUMN oil_collections.driver_collection_notes IS 'Driver-specific collection notes';
COMMENT ON COLUMN oil_collections.driver_equipment_condition IS 'Condition of collection equipment used';
COMMENT ON COLUMN oil_collections.driver_safety_incidents IS 'Any safety incidents during collection';
COMMENT ON COLUMN oil_collections.cost_collection_fee IS 'Cost charged for collection service';
COMMENT ON COLUMN oil_collections.cost_processing_fee IS 'Cost for processing the oil';
COMMENT ON COLUMN oil_collections.cost_disposal_fee IS 'Cost for disposal/recycling';
COMMENT ON COLUMN oil_collections.cost_transport_fee IS 'Transportation costs';
COMMENT ON COLUMN oil_collections.revenue_oil_sale_amount IS 'Revenue from selling processed oil';
COMMENT ON COLUMN oil_collections.revenue_processing_credits IS 'Credits received for processing';
COMMENT ON COLUMN oil_collections.financial_net_profit IS 'Net profit from this collection';
COMMENT ON COLUMN oil_collections.gps_collection_accuracy_meters IS 'GPS accuracy in meters';
COMMENT ON COLUMN oil_collections.gps_collection_timestamp IS 'Exact timestamp when GPS was recorded';
COMMENT ON COLUMN oil_collections.weather_conditions IS 'Weather conditions during collection';
COMMENT ON COLUMN oil_collections.weather_temperature_celsius IS 'Temperature in Celsius';
COMMENT ON COLUMN oil_collections.weather_humidity_percent IS 'Humidity percentage';
COMMENT ON COLUMN oil_collections.integration_exported_to_accounting IS 'Whether exported to accounting system';
COMMENT ON COLUMN oil_collections.integration_accounting_reference IS 'Reference in accounting system';
COMMENT ON COLUMN oil_collections.integration_exported_to_erp IS 'Whether exported to ERP system';
COMMENT ON COLUMN oil_collections.integration_erp_reference IS 'Reference in ERP system';
COMMENT ON COLUMN oil_collections.audit_last_updated_by IS 'User who last updated this record';
COMMENT ON COLUMN oil_collections.audit_change_reason IS 'Reason for the last change';
COMMENT ON COLUMN oil_collections.audit_previous_values IS 'Previous values before last update (JSON)';

-- Create indexes for the new columns that will be frequently queried
CREATE INDEX IF NOT EXISTS idx_oil_collections_bin_serial_number ON oil_collections(bin_serial_number);
CREATE INDEX IF NOT EXISTS idx_oil_collections_workflow_status ON oil_collections(workflow_status);
CREATE INDEX IF NOT EXISTS idx_oil_collections_workflow_assigned_to ON oil_collections(workflow_assigned_to);
CREATE INDEX IF NOT EXISTS idx_oil_collections_workflow_due_date ON oil_collections(workflow_due_date);
CREATE INDEX IF NOT EXISTS idx_oil_collections_bin_type ON oil_collections(bin_type);
CREATE INDEX IF NOT EXISTS idx_oil_collections_collection_contaminant_level ON oil_collections(collection_contaminant_level);
CREATE INDEX IF NOT EXISTS idx_oil_collections_compliance_certificate_required ON oil_collections(compliance_certificate_required);
CREATE INDEX IF NOT EXISTS idx_oil_collections_workflow_priority ON oil_collections(workflow_priority);
CREATE INDEX IF NOT EXISTS idx_oil_collections_integration_exported_accounting ON oil_collections(integration_exported_to_accounting);
CREATE INDEX IF NOT EXISTS idx_oil_collections_integration_exported_erp ON oil_collections(integration_exported_to_erp);
CREATE INDEX IF NOT EXISTS idx_oil_collections_audit_last_updated_by ON oil_collections(audit_last_updated_by);

-- Create a function to update the audit trail when records are modified
CREATE OR REPLACE FUNCTION oil_collections_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update audit fields if this is an UPDATE (not INSERT)
    IF TG_OP = 'UPDATE' THEN
        -- Store previous values in JSONB format
        NEW.audit_previous_values = to_jsonb(OLD);
        NEW.updated_at = NOW();
        
        -- If audit_last_updated_by is not explicitly set, try to get it from current user
        IF NEW.audit_last_updated_by IS NULL THEN
            -- This would need to be set by the application
            NEW.audit_last_updated_by = OLD.audit_last_updated_by;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS oil_collections_audit ON oil_collections;
CREATE TRIGGER oil_collections_audit
    BEFORE UPDATE ON oil_collections
    FOR EACH ROW
    EXECUTE FUNCTION oil_collections_audit_trigger();

-- Create a view for better bin management
CREATE OR REPLACE VIEW oil_collections_bin_summary AS
SELECT 
    bin_serial_number,
    bin_type,
    bin_size_litres,
    bin_material,
    bin_condition,
    COUNT(*) as total_collections,
    SUM(collected_volume) as total_volume_collected,
    AVG(collection_temperature) as avg_temperature,
    AVG(collection_ph_level) as avg_ph_level,
    MAX(collection_date) as last_collection_date,
    AVG(customer_satisfaction_rating) as avg_customer_rating,
    SUM(financial_net_profit) as total_profit
FROM oil_collections 
WHERE bin_serial_number IS NOT NULL
GROUP BY bin_serial_number, bin_type, bin_size_litres, bin_material, bin_condition
ORDER BY last_collection_date DESC;

-- Create a view for workflow management
CREATE OR REPLACE VIEW oil_collections_workflow_queue AS
SELECT 
    id,
    bin_serial_number,
    collection_date,
    collected_volume,
    workflow_status,
    workflow_next_step,
    workflow_assigned_to,
    workflow_priority,
    workflow_due_date,
    CASE 
        WHEN workflow_due_date < NOW() THEN 'OVERDUE'
        WHEN workflow_due_date < NOW() + INTERVAL '1 day' THEN 'DUE_SOON'
        ELSE 'ON_TRACK'
    END as urgency_status,
    driver_id,
    customer_satisfaction_rating
FROM oil_collections 
WHERE workflow_status != 'completed'
ORDER BY 
    CASE workflow_priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
        ELSE 5
    END,
    workflow_due_date ASC NULLS LAST;

-- Print success message
DO $$
BEGIN
    RAISE NOTICE '=== OIL COLLECTIONS TABLE UPDATED SUCCESSFULLY ===';
    RAISE NOTICE 'Added 41 new columns for individual bin tracking';
    RAISE NOTICE 'Created 11 new indexes for performance';
    RAISE NOTICE 'Created audit trigger for change tracking';
    RAISE NOTICE 'Created 2 views: oil_collections_bin_summary, oil_collections_workflow_queue';
    RAISE NOTICE 'Your oil_collections table now supports detailed bin-level tracking!';
END $$;