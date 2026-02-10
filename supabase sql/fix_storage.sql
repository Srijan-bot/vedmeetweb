-- 1. Policy for Uploading
-- Allows users to upload files to the 'prescriptions' bucket
-- The file path must start with their user ID (e.g. 'user_id/filename.jpg')
create policy "Users can upload their own prescription images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'prescriptions' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Policy for Viewing (User)
-- Allows users to view/download their own files
create policy "Users can view their own prescription images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'prescriptions' and
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Policy for Viewing (Admin/Doctor)
-- Allows admins and doctors to view ALL files in the bucket
create policy "Admins can view all prescription images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'prescriptions' and
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role in ('admin', 'doctor')
  )
);
