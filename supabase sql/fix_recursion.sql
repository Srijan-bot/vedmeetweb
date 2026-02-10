-- Fix Infinite Recursion in Profiles Policy
-- The issue is that checking "role" in the policy itself queries "profiles", causing a loop.

-- 1. Create a helper function to get the current user's role securely
-- This avoids querying the table directly inside the policy if possible, 
-- OR we use a simplified policy that avoids checking "role" for the admin check if we can help it.
-- BUT, since role is IN the profiles table, we have a classic RLS recursion problem.

-- SOLUTION: Use `auth.jwt()` metadata if you sync roles there, OR break the recursion.
-- A common way to break recursion is to allow users to read their OWN profile without checking role, 
-- and separate the "Admin View All" content.

-- However, for "Admins can view all", we need to know if the user is an admin.
-- If we look up the user's role in the `profiles` table to see if they can see the `profiles` table... infinite loop.

-- BETTER APPROACH: 
-- 1. Drop the problematic policies.
-- 2. "Users can view own profile" (No recursion, just ID check).
-- 3. "Admins can view all profiles" -> This is the hard one.

-- We can try to use a SECURITY DEFINER function to check the role, 
-- but even that queries the table.

-- ALTERNATIVE: 
-- Assume the recursive policy is: `(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'`
-- We can fix this by ensuring the query for the "checker" doesn't trigger the policy again? 
-- No, RLS is row-level.

-- BEST FIX used in Supabase commonly:
-- Store role in `auth.users` metadata (raw_user_meta_data) and check that instead!
-- OR, assume if you are trying to READ, you might not need to check role if we just make profiles public-ish?
-- But we want to restrict.

-- START FRESH with policies to break the loop:

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;


-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- 2. Admins can view all (AVOID RECURSION using a trick or metadata)
-- If we trust the metadata:
-- CREATE POLICY "Admins can view all profiles" ON public.profiles
-- FOR SELECT USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'); 
-- (This requires custom claims which might not be set up)

-- DIRECT FIX:
-- Define a function that bypasses RLS to check the role.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the user has an admin role. 
  -- We query profiles directly but we need to ensure this function 
  -- doesn't trigger RLS loop if used INSIDE a policy.
  -- Actually, the best way is to check `auth.users` metadata if synced.
  -- But if we rely on `profiles.role`, we are stuck unless we use a View or bypass RLS.
  
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'superadmin', 'seo_writer', 'agent')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
-- SECURITY DEFINER means it runs with permissions of the creator (postgres/admin), 
-- bumping it above RLS constraints for *this* select.

CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
  public.is_admin()
);

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (
  public.is_admin()
);

CREATE POLICY "Admins can delete all profiles" ON public.profiles
FOR DELETE USING (
   public.is_admin()
);
