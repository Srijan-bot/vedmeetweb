-- Add missing columns to profiles table
alter table profiles 
add column if not exists age integer,
add column if not exists gender text,
add column if not exists bio text;

-- Ensure phone_number is consistent (renaming if users use 'phone' elsewhere, but better to stick to one. DB has phone_number)
-- We will update frontend to use phone_number to match DB
