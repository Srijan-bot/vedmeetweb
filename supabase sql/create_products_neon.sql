-- Create Products Table (if missing in Neon)
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  image text,
  category text,
  rating numeric default 0,
  reviews integer default 0,
  brand text,
  stock_status text default 'In Stock',
  features text,
  ingredients text,
  benefits text,
  usage text,
  stock_quantity integer default 0, -- Legacy stock column
  disc_price numeric,
  discount_percentage integer default 0,
  concern text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table products enable row level security;
create policy "Public Access" on products for all using (auth.role() = 'authenticated');
