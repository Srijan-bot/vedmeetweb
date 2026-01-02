-- Add ALL potentially missing columns to the profiles table
alter table public.profiles 
add column if not exists full_name text,
add column if not exists phone_number text,
add column if not exists address text,
add column if not exists latitude float,
add column if not exists longitude float;

-- Reload the schema cache (critical for Supabase to see new columns)
notify pgrst, 'reload config';
