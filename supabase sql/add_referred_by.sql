
-- Add referred_by column to prescriptions table
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES public.profiles(id);

-- Update RLS policies (optional but good practice)
-- Ensure admins/doctors can see/edit this? They already can via current policies.
