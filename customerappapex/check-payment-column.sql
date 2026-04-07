-- Check if payment_amount column exists in oil_collections table

SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'oil_collections' 
  AND table_schema = 'public'
  AND column_name LIKE '%payment%'
ORDER BY column_name;

-- List all cost/revenue related columns
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'oil_collections' 
  AND table_schema = 'public'
  AND (column_name LIKE '%cost%' OR column_name LIKE '%revenue%' OR column_name LIKE '%payment%' OR column_name LIKE '%financial%')
ORDER BY column_name;
