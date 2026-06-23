-- ============================================================================
-- Pickup Forecast columns — 2026-06-23
-- Adds structured columns to the jobs table so the admin dashboard can
-- aggregate "litres / kg per area per day" and build a 7-day forecast.
--
-- Before this change, estimated quantity and oil type were buried in the
-- `notes` text field, which made SQL aggregation impossible.
--
-- Apply via: Supabase Dashboard → SQL Editor → paste → Run
-- Or via the Management API (see deploy notes in commit message).
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. New columns on jobs
-- ---------------------------------------------------------------------------
alter table jobs
    add column if not exists pickup_mode         text default 'bin',    -- 'bin' | 'quick'
    add column if not exists oil_type            text default 'UCO',    -- UCO, BLACK_OIL, ACID_OIL, …
    add column if not exists estimated_quantity  text,                  -- raw user text e.g. "20L", "15kg", "2 drums"
    add column if not exists estimated_liters    numeric(10,2),         -- parsed number in litres (for SUM)
    add column if not exists estimated_kg        numeric(10,2),         -- parsed number in kg (oil density ~0.92 kg/L)
    add column if not exists area                text,                  -- suburb/town parsed from pickup_address
    add column if not exists scheduled_date      date;                  -- optional future date the customer wants pickup

comment on column jobs.pickup_mode        is 'bin = customer scanned/selected a bin; quick = no bin, depot weighs on arrival';
comment on column jobs.estimated_liters   is 'Parsed from estimated_quantity text. Null for legacy rows.';
comment on column jobs.area               is 'Suburb / town parsed from pickup_address for per-area forecasting';

-- ---------------------------------------------------------------------------
-- 2. Backfill area + estimated_liters for existing rows (best-effort parse)
--    The customer app now writes these directly going forward; this just
--    salvages historical rows so the chart isn't empty on day one.
-- ---------------------------------------------------------------------------
update jobs
set pickup_mode = case
    when notes ilike '%QUICK_PICKUP%' then 'quick'
    when notes ilike '%BIN_PICKUP%'   then 'bin'
    else coalesce(pickup_mode, 'bin')
end
where pickup_mode is null;

-- Parse "Estimated quantity: 20L" / "15kg" / "2 drums" from notes → estimated_quantity
update jobs
set estimated_quantity = (regexp_match(notes, 'Estimated quantity:\s*([^\n]+)', 'i'))[1]
where estimated_quantity is null
  and notes ilike '%Estimated quantity:%';

-- Derive a litre number from the estimated_quantity text.
-- Handles "20L", "20 L", "20litres", "15kg" (×1/0.92), "15 kg", "2 drums" (×193 default)
update jobs
set estimated_liters = round(
    case
        when estimated_quantity ~* '^[[:space:]]*[0-9]+(\.[0-9]+)?[[:space:]]*(l|lit|litre|litres|liter|liters)' then
            (regexp_match(estimated_quantity, '([0-9]+(\.[0-9]+)?)'))[1]::numeric
        when estimated_quantity ~* '^[[:space:]]*[0-9]+(\.[0-9]+)?[[:space:]]*(kg|kilo|kilogram)' then
            (regexp_match(estimated_quantity, '([0-9]+(\.[0-9]+)?)'))[1]::numeric / 0.92
        when estimated_quantity ~* 'drum' then
            (regexp_match(estimated_quantity, '([0-9]+(\.[0-9]+)?)'))[1]::numeric * 193
        else null
    end, 2
)
where estimated_quantity is not null
  and estimated_liters is null;

-- estimated_kg = estimated_liters × 0.92
update jobs
set estimated_kg = round(estimated_liters * 0.92, 2)
where estimated_liters is not null
  and estimated_kg is null;

-- area: take the second-to-last comma chunk of pickup_address (typically the suburb)
-- "123 Sarit Centre, Westlands, Nairobi, Kenya" → "Westlands"
update jobs
set area = btrim(split_part(
    regexp_replace(pickup_address, ',\s*', ',', 'g'),
    ',', greatest(1, array_length(string_to_array(regexp_replace(pickup_address, ',\s*', ',', 'g'), ','), 1) - 1)
))
where area is null
  and pickup_address is not null
  and pickup_address like '%,%';

-- scheduled_date: pull from notes "Scheduled" hint or default to created_at::date
update jobs
set scheduled_date = coalesce(
    (regexp_match(notes, 'Scheduled[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})', 'i'))[1]::date,
    created_at::date
)
where scheduled_date is null;

-- ---------------------------------------------------------------------------
-- 3. Indexes for the dashboard queries
-- ---------------------------------------------------------------------------
create index if not exists jobs_oil_collection_area_date_idx
    on jobs (area, scheduled_date)
    where job_type = 'oil_collection';

create index if not exists jobs_oil_collection_status_idx
    on jobs (status, scheduled_date)
    where job_type = 'oil_collection';

-- ---------------------------------------------------------------------------
-- 4. RLS — admins (anon key in this project) already read jobs; no change
--    needed. New columns inherit table-level policies.
-- ---------------------------------------------------------------------------

commit;
