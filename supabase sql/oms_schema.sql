-- Order Management System Schema (Enhanced)
-- Created: 2026-01-01

-- 1. Update Orders Table with Financial & Status fields
do $$
begin
  -- Statuses: Pending, Confirmed, Processing, Shipped, Delivered, Cancelled, Returned
  
  -- Add columns if they don't exist
  if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'tax_amount') then
    alter table orders add column tax_amount numeric default 0;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'shipping_amount') then
    alter table orders add column shipping_amount numeric default 0;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'discount_amount') then
    alter table orders add column discount_amount numeric default 0;
  end if;

  if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'shipping_address') then
    alter table orders add column shipping_address jsonb;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'orders' and column_name = 'notes') then
    alter table orders add column notes text;
  end if;
end $$;

-- 2. Invoices Table
create table if not exists invoices (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete restrict unique not null,
  invoice_number text unique not null, -- e.g. INV-2024-001
  invoice_date timestamp with time zone default timezone('utc'::text, now()),
  total_amount numeric not null,
  tax_amount numeric not null,
  pdf_url text, -- Link to generated PDF in storage
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Shipments Table
create table if not exists shipments (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete restrict unique not null,
  courier_name text,
  tracking_id text,
  tracking_url text,
  shipped_at timestamp with time zone default timezone('utc'::text, now()),
  delivered_at timestamp with time zone,
  status text default 'Shipped', -- Shipped, In Transit, Delivered, Returned
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Order Status History (Log)
create table if not exists order_status_history (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references orders(id) on delete cascade not null,
  old_status text,
  new_status text not null,
  changed_by uuid references auth.users(id),
  changed_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS Policies
alter table invoices enable row level security;
alter table shipments enable row level security;
alter table order_status_history enable row level security;

create policy "Users can view own invoices" on invoices
for select using (
  exists (select 1 from orders where orders.id = invoices.order_id and (orders.user_id = auth.uid()))
);

create policy "Admins manage all" on invoices for all using (true); -- Simplify for now
create policy "Admins manage shipments" on shipments for all using (true);
create policy "Admins manage history" on order_status_history for all using (true);
