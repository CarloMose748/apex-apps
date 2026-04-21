-- Storage setup for customer-uploaded official compliance PDFs.
-- Run this once in Supabase SQL editor before using the upload workflow.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'compliance-submissions',
  'compliance-submissions',
  false,
  10485760,
  array['application/pdf', 'application/json']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can upload their own compliance PDFs" on storage.objects;
create policy "Users can upload their own compliance PDFs"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'compliance-submissions'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Users can view their own compliance PDFs" on storage.objects;
create policy "Users can view their own compliance PDFs"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'compliance-submissions'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Users can update their own compliance PDFs" on storage.objects;
create policy "Users can update their own compliance PDFs"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'compliance-submissions'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'compliance-submissions'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "Users can delete their own compliance PDFs" on storage.objects;
create policy "Users can delete their own compliance PDFs"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'compliance-submissions'
  and (storage.foldername(name))[2] = auth.uid()::text
);