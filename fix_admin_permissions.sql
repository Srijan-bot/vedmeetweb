DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role text DEFAULT 'user';
    END IF;
END $$;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete all profiles" ON public.profiles;

-- Create policy to allow Admins to UPDATE any profile
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin', 'seo_writer') 
    );

-- Create policy to allow Admins to DELETE any profile
CREATE POLICY "Admins can delete all profiles" ON public.profiles
    FOR DELETE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'superadmin') 
    );

-- Ensure the 'role' column has a check constraint for valid roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'admin', 'seo_writer', 'doctor'));
