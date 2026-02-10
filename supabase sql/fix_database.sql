-- Drop the old trigger/function first
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Ensure profiles table exists
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  phone_number text,
  address text,
  latitude float,
  longitude float,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Re-enable RLS just in case
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

-- Exception-Safe Trigger Function
create or replace function public.handle_new_user()
returns trigger as $$
begin
  begin
    insert into public.profiles (id, full_name)
    values (
      new.id, 
      coalesce(new.raw_user_meta_data->>'full_name', '')
    )
    on conflict (id) do nothing;
  exception when others then
    -- Log the error if possible, or just ignore it to allow signup to succeed
    raise warning 'Error creating profile for user %: %', new.id, SQLERRM;
  end;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Recreate Trigger
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
