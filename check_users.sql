-- Check if the user exists in profiles and what their role is
-- NOTE: We cannot query auth.users directly from the SQL Editor usually, but we rely on profiles.
-- If the user is in auth but not profiles, the trigger failed.

SELECT email, role, id FROM public.profiles;

-- Check if there are any users with 'agent' role
SELECT count(*) as agent_count FROM public.profiles WHERE role = 'agent';
