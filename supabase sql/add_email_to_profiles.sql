-- 1. Add email column to profiles if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email text;
    END IF;
END $$;

-- 2. Update the handle_new_user function to save email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email; -- Update email if profile exists
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Backfill emails for existing users
-- (This requires permission to read auth.users, which you have in the SQL Editor)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
