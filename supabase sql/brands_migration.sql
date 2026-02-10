-- Create brands table
create table brands (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  logo text,
  description text,
  origin_country text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security) if you are using it, or leave open for admin if backend handles it
-- For simple setup:
alter table brands enable row level security;

-- Create policy to allow all access (adjust for production)
create policy "Allow all access" on brands for all using (true) with check (true);
