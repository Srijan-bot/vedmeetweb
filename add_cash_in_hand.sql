-- Add cash_in_hand column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cash_in_hand numeric DEFAULT 0;
