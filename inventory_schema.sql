
-- Inventory Management System Migration
-- Created at: 2025-12-31

-- 1. Warehouses Table
create table if not exists warehouses (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Seed default warehouse
insert into warehouses (name, location) values ('Main Warehouse', 'Default Location')
on conflict do nothing;

-- 2. Product Variants Table
-- Supports linking multiple SKUs to a single product (size, color, etc.)
create table if not exists product_variants (
  id uuid default uuid_generate_v4() primary key,
  product_id uuid references products(id) on delete cascade not null,
  sku text unique,
  name text not null, -- e.g. "Small", "Regular", "Red"
  
  -- Pricing & Accounting
  price numeric not null default 0, -- Selling Price
  cost_price numeric default 0, -- COGS tracking
  mrp numeric default 0, -- Maximum Retail Price
  
  -- GST Fields
  hsn_code text,
  gst_rate numeric default 0, -- 0, 5, 12, 18, 28
  
  stock_quantity integer default 0, -- Read-only, updated via triggers
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Inventory Transactions (The Ledger)
-- Immutable record of every stock change
create table if not exists inventory_transactions (
  id uuid default uuid_generate_v4() primary key,
  warehouse_id uuid references warehouses(id) on delete restrict not null,
  variant_id uuid references product_variants(id) on delete restrict not null,
  
  quantity_change integer not null, -- Positive for add, Negative for remove
  transaction_type text not null check (transaction_type in ('purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'import', 'opening_stock')),
  
  reason text,
  reference_id text, -- Order ID, Transfer ID, etc.
  performed_by uuid references auth.users(id), -- Admin user ID
  
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Warehouse Stock Summary (Materialized / Cached View)
-- Keeps track of stock per variant per warehouse for fast lookup
create table if not exists warehouse_stock (
  id uuid default uuid_generate_v4() primary key,
  warehouse_id uuid references warehouses(id) on delete cascade not null,
  variant_id uuid references product_variants(id) on delete cascade not null,
  quantity integer default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(warehouse_id, variant_id)
);

-- 5. Indexes for Performance
create index if not exists idx_inventory_transactions_variant on inventory_transactions(variant_id);
create index if not exists idx_inventory_transactions_warehouse on inventory_transactions(warehouse_id);
create index if not exists idx_warehouse_stock_lookup on warehouse_stock(warehouse_id, variant_id);

-- 6. Trigger to Update Warehouse Stock Summary
create or replace function update_warehouse_stock_trigger()
returns trigger as $$
begin
  -- Upsert into warehouse_stock
  insert into warehouse_stock (warehouse_id, variant_id, quantity)
  values (NEW.warehouse_id, NEW.variant_id, NEW.quantity_change)
  on conflict (warehouse_id, variant_id)
  do update set 
    quantity = warehouse_stock.quantity + NEW.quantity_change,
    updated_at = now();
    
  -- Update total stock in product_variants (Aggregation for convenience)
  update product_variants
  set stock_quantity = (
    select coalesce(sum(quantity), 0)
    from warehouse_stock
    where variant_id = NEW.variant_id
  )
  where id = NEW.variant_id;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_update_stock
after insert on inventory_transactions
for each row
execute function update_warehouse_stock_trigger();

-- 7. RLS Policies (Admin usage presumed, but good practice)
alter table warehouses enable row level security;
alter table product_variants enable row level security;
alter table inventory_transactions enable row level security;
alter table warehouse_stock enable row level security;

-- Simple public read/write for now given the context is "Admin Dashboard" with shared login
-- In a stricter app, we would check for admin role in policies
create policy "Allow all access to authenticated users" on warehouses for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on product_variants for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on inventory_transactions for all using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on warehouse_stock for all using (auth.role() = 'authenticated');

