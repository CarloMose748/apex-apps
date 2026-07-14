-- =====================================================================
-- Migration: depot-event-files storage bucket
-- Purpose : Allows the Depot app (aggregator/) to upload photos and
--           documents attached to bin receipt events, and lets the
--           admin panel display them.
--
-- Background:
--   Previously the depot app saved ONLY the filename string into
--   high_aggregator_events.photo_url, so the admin panel could only
--   display raw text like "1783935501869...jpg" instead of the actual
--   picture. This migration adds a real Supabase Storage bucket and
--   RLS policies so the depot app can upload the file and store its
--   public URL instead.
--
-- Applied on: 2026-07-14
-- Apply with:
--   curl -s -X POST "https://api.supabase.com/v1/projects/ishhgfitddfeqaatimwl/database/query" \
--     -H "Authorization: Bearer <service_role_key>" \
--     -H "Content-Type: application/json" \
--     -d @depot-event-files-storage.sql.json
-- =====================================================================

-- 1. Public bucket (10 MB cap; common image + office doc types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'depot-event-files',
  'depot-event-files',
  true,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS policies for the new bucket
CREATE POLICY "depot-event-files: public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'depot-event-files');

CREATE POLICY "depot-event-files: authenticated upload"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'depot-event-files');

CREATE POLICY "depot-event-files: authenticated update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'depot-event-files')
  WITH CHECK (bucket_id = 'depot-event-files');

CREATE POLICY "depot-event-files: authenticated delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'depot-event-files');
