-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Create Prescriptions Table
create table if not exists public.prescriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  image_path text not null,
  status text default 'pending' check (status in ('pending', 'referred', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Prescription Items Table (Referred Medicines)
-- FIXED: medicine_id is bigint to match products.id
create table if not exists public.prescription_items (
  id uuid default uuid_generate_v4() primary key,
  prescription_id uuid references public.prescriptions(id) on delete cascade not null,
  medicine_id bigint references public.products(id) not null, 
  is_alternative boolean default false,
  doctor_note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Prescription Queries Table (User Questions)
create table if not exists public.prescription_queries (
  id uuid default uuid_generate_v4() primary key,
  prescription_id uuid references public.prescriptions(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Update Notifications Table (Ensure columns exist)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'type') then
    alter table public.notifications add column type text;
  end if;
  if not exists (select 1 from information_schema.columns where table_name = 'notifications' and column_name = 'reference_id') then
    alter table public.notifications add column reference_id uuid;
  end if;
end $$;

-- 5. Enable RLS
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.prescription_queries enable row level security;

-- 6. RLS Policies

-- Drop existing policies if they exist to avoid conflict on re-run (optional but safe)
drop policy if exists "Users can view their own prescriptions" on public.prescriptions;
drop policy if exists "Users can upload prescriptions" on public.prescriptions;
drop policy if exists "Admins/Doctors can view all prescriptions" on public.prescriptions;
drop policy if exists "Admins/Doctors can update prescriptions" on public.prescriptions;

-- Prescriptions
create policy "Users can view their own prescriptions"
  on public.prescriptions for select
  using (auth.uid() = user_id);

create policy "Users can upload prescriptions"
  on public.prescriptions for insert
  with check (auth.uid() = user_id);

create policy "Admins/Doctors can view all prescriptions"
  on public.prescriptions for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'doctor')
    )
  );

create policy "Admins/Doctors can update prescriptions"
  on public.prescriptions for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'doctor')
    )
  );

-- Prescription Items
drop policy if exists "Users can view their prescription items" on public.prescription_items;
drop policy if exists "Admins/Doctors can manage prescription items" on public.prescription_items;

create policy "Users can view their prescription items"
  on public.prescription_items for select
  using (
    exists (
      select 1 from public.prescriptions
      where prescriptions.id = prescription_items.prescription_id
      and prescriptions.user_id = auth.uid()
    )
  );

create policy "Admins/Doctors can manage prescription items"
  on public.prescription_items for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'doctor')
    )
  );

-- Prescription Queries
drop policy if exists "Users can view their own queries" on public.prescription_queries;
drop policy if exists "Users can create queries" on public.prescription_queries;
drop policy if exists "Admins/Doctors can view all queries" on public.prescription_queries;

create policy "Users can view their own queries"
  on public.prescription_queries for select
  using (auth.uid() = user_id);

create policy "Users can create queries"
  on public.prescription_queries for insert
  with check (auth.uid() = user_id);

create policy "Admins/Doctors can view all queries"
  on public.prescription_queries for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role in ('admin', 'doctor')
    )
  );
