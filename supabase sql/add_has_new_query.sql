-- Add has_new_query column to prescriptions table
alter table public.prescriptions 
add column if not exists has_new_query boolean default false;

-- Update RLS policies to allow updating this column (already covered by 'users can upload' or 'admins can update', but users need to update this specific column via a function or policy)
-- Actually, simple update might fail if policy is strict.
-- Admin policy: "Admins/Doctors can update prescriptions" -> OK.
-- User policy: "Users can upload prescriptions" (insert only). Users usually CANNOT update their own prescription status. 
-- So we need a policy or a security definer function to allow USER to set has_new_query = true.

create or replace function public.set_new_query_flag(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.prescriptions
  set has_new_query = true
  where id = p_id;
end;
$$;

create or replace function public.clear_new_query_flag(p_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.prescriptions
  set has_new_query = false
  where id = p_id;
end;
$$;
