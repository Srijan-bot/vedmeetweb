-- Create user_addresses table
create table if not exists user_addresses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  label text, -- e.g., 'Home', 'Work'
  full_address text not null,
  street text,
  city text,
  state text,
  zip_code text,
  country text,
  is_default boolean default false,
  coordinates point, -- optionally store lat/lng
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table user_addresses enable row level security;

-- Policies
create policy "Users can view their own addresses"
  on user_addresses for select
  using (auth.uid() = user_id);

create policy "Users can insert their own addresses"
  on user_addresses for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own addresses"
  on user_addresses for update
  using (auth.uid() = user_id);

create policy "Users can delete their own addresses"
  on user_addresses for delete
  using (auth.uid() = user_id);

-- Only one default address per user trigger
create or replace function handle_default_address()
returns trigger as $$
begin
  if new.is_default then
    update user_addresses
    set is_default = false
    where user_id = new.user_id
    and id != new.id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_manage_default_address
  before insert or update on user_addresses
  for each row
  execute procedure handle_default_address();
