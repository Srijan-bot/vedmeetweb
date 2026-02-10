-- Enable RLS on storage.objects if not already enabled (it usually is)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone (public) to READ files in the 'products' bucket
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- Policy to allow authenticated users to UPLOAD files to the 'products' bucket
-- Adjust 'authenticated' to 'public' if you want unauthenticated uploads (not recommended usually, but possible)
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'products' );

-- Policy to allow users to UPDATE their own files (optional, or allow all authenticated)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'products' );

-- Policy to allow users to DELETE their own files (optional)
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'products' );
