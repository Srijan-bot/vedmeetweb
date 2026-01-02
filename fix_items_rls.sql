-- Ensure RLS is enabled
alter table public.prescription_items enable row level security;

-- Drop existing policy if exists to avoid errors on duplicate
drop policy if exists "Users can view their prescription items" on public.prescription_items;

-- Create policy for users to see items belonging to their prescriptions
create policy "Users can view their prescription items"
  on public.prescription_items for select
  using (
    exists (
      select 1 from public.prescriptions
      where public.prescriptions.id = public.prescription_items.prescription_id
      and public.prescriptions.user_id = auth.uid()
    )
  );
