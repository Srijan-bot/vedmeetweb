-- Check constraints on profiles table
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- Check policies on profiles table
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if any user has role 'agent'
SELECT count(*) FROM profiles WHERE role = 'agent';
