create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$;

create or replace function public.is_admin_or_doctor()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role in ('admin', 'doctor')
  );
end;
$$;

-- Fix Profiles RLS
alter table public.profiles enable row level security;

drop policy if exists "Public profiles" on public.profiles;
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Users can view own profile" on public.profiles;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (is_admin());

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Fix Appointments RLS
drop policy if exists "Read appointments" on public.appointments;
create policy "Read appointments"
  on public.appointments for select
  using (
    (auth.uid() = user_id) OR 
    is_admin_or_doctor()
  );

drop policy if exists "Update appointments" on public.appointments;
create policy "Update appointments"
  on public.appointments for update
  using (is_admin_or_doctor());

drop policy if exists "Delete appointments" on public.appointments;
create policy "Delete appointments"
  on public.appointments for delete
  using (is_admin());
