-- Create Appointments Table
create table if not exists public.appointments (
  id uuid default uuid_generate_v4() primary key,
  doctor_id uuid references public.doctors(id),
  user_id uuid references auth.users(id), -- Nullable for guest bookings
  patient_name text not null,
  patient_email text,
  patient_phone text,
  appointment_date date not null,
  appointment_time time not null,
  status text default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  payment_status text default 'pending', -- pending, paid
  amount numeric(10,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.appointments enable row level security;

-- Policies

-- 1. Read access
-- Users can see their own appointments (if logged in and user_id matches)
-- Admins and Doctors can see all appointments
drop policy if exists "Read appointments" on public.appointments;
create policy "Read appointments"
  on public.appointments for select
  using (
    (auth.uid() = user_id) OR 
    (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'doctor')))
  );

-- 2. Insert access
-- Anyone can book an appointment (public)
drop policy if exists "Book appointments" on public.appointments;
create policy "Book appointments"
  on public.appointments for insert
  with check (true);

-- 3. Update access
-- Admins and Doctors can update appointments (e.g. status)
drop policy if exists "Update appointments" on public.appointments;
create policy "Update appointments"
  on public.appointments for update
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'doctor'))
  );

-- 4. Delete access
-- Admins can delete
drop policy if exists "Delete appointments" on public.appointments;
create policy "Delete appointments"
  on public.appointments for delete
  using (
    exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );
