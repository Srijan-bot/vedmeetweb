-- Create a table for Product Bundles / Combos
create table if not exists bundles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null, -- The discounted price of the whole bundle
  original_price numeric, -- The sum of original prices of components
  components jsonb not null, -- Array of objects: [{ product_id, variant_id, name, image, quantity }]
  image text, -- Optional image for the bundle itself
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies if needed (simplified for now)
alter table bundles enable row level security;

create policy "Public bundles are viewable by everyone."
  on bundles for select
  using ( true );

create policy "Admins can insert bundles."
  on bundles for insert
  with check ( true ); -- In real app, check for admin role

create policy "Admins can update bundles."
  on bundles for update
  using ( true );

create policy "Admins can delete bundles."
  on bundles for delete
  using ( true );
