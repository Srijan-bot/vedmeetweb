-- Allow Admins to View All Profiles
-- This is necessary for the User Manager to see the new user after creation

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin', 'seo_writer', 'agent') 
    );

-- Also ensure specific access for the owner (User can view own profile)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id
    );

-- Fallback: If you want profiles to be public (viewable by everyone authenticated)
-- verify if "Public profiles are viewable by everyone" exists or create it:
-- CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
