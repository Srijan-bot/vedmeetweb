-- Update the check constraint to include 'agent'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'seo_writer', 'doctor', 'agent'));

-- Ensure policies allow managing this role (re-affirming existing policies basically)
-- Admins can update all profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin', 'seo_writer') 
    );

-- Admins can delete all profiles
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;
CREATE POLICY "Admins can delete all profiles" ON public.profiles
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin') 
    );
