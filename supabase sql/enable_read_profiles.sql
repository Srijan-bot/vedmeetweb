-- Enable RLS on profiles if not already enabled (it usually is)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users (like admins and agents) to view all profiles
-- This is needed so that the Admin Dashboard can show the names of assigned agents.
CREATE POLICY "Enable read access for authenticated users"
ON "public"."profiles"
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- If there was a strict policy blocking it, this permissive one should allow it.
-- Alternatively, if there is a 'users can only see own profile' policy, we might need to ensure this one overrides or complements it.
-- Supabase policies are additive (OR), so adding this permissive one opens it up.
