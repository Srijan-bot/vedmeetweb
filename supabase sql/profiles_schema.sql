-- Drop the existing trigger and function to ensure a clean slate
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Ensure the profiles table exists and has the correct columns
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  phone_number text,
  address text,
  latitude float,
  longitude float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile." on public.profiles
  for insert with check ((select auth.uid()) = id);

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile." on public.profiles
  for update using ((select auth.uid()) = id);

-- Admin Policies
drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles" on public.profiles
    for update
    using (
        (select role from public.profiles where id = auth.uid()) in ('admin', 'superadmin', 'seo_writer') 
    );

drop policy if exists "Admins can delete all profiles" on public.profiles;
create policy "Admins can delete all profiles" on public.profiles
    for delete
    using (
        (select role from public.profiles where id = auth.uid()) in ('admin', 'superadmin') 
    );

-- Constraints
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check 
    check (role in ('user', 'admin', 'seo_writer', 'doctor'));

-- Robust Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email
  )
  on conflict (id) do update set
    email = excluded.email;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Recreate the trigger
-- Recreate the trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to allow admins to delete users
create or replace function public.delete_user(target_user_id uuid)
returns void as $$
begin
  -- Check if the executing user is an admin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin')
  ) then
    raise exception 'You do not have permission to delete users.';
  end if;

  -- Delete from auth.users (cascades to profiles)
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer;
