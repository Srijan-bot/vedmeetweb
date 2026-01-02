-- Accounting System Schema
-- Created: 2026-01-01

-- 1. Chart of Accounts
create table if not exists accounting_accounts (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null, -- e.g., '1000' for Assets, '4000' for Revenue
  name text not null,
  type text not null check (type in ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  description text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Seed Default Accounts
insert into accounting_accounts (code, name, type, description) values
('1010', 'Inventory Asset', 'Asset', 'Value of stock on hand'),
('1020', 'Accounts Receivable', 'Asset', 'Money owed by customers'),
('1030', 'Cash / Bank', 'Asset', 'Money received'),
('2010', 'Sales Tax Payable', 'Liability', 'GST collected, to be paid'),
('4010', 'Sales Revenue', 'Revenue', 'Income from product sales'),
('4020', 'Shipping Income', 'Revenue', 'Income from shipping charges'),
('5010', 'Cost of Goods Sold', 'Expense', 'Direct costs of producing goods sold'),
('5020', 'Discounts Given', 'Expense', 'Promotional discounts')
on conflict (code) do nothing;

-- 2. General Ledger (Journal Entries)
create table if not exists accounting_ledger (
  id uuid default uuid_generate_v4() primary key,
  transaction_date timestamp with time zone default timezone('utc'::text, now()) not null,
  description text not null,
  reference_id text, -- Order ID, Invoice ID, etc.
  reference_type text, -- 'order', 'adjustment', 'expense'
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Journal Lines (Debits and Credits)
create table if not exists accounting_journal_lines (
  id uuid default uuid_generate_v4() primary key,
  ledger_id uuid references accounting_ledger(id) on delete cascade not null,
  account_id uuid references accounting_accounts(id) not null,
  debit numeric default 0 check (debit >= 0),
  credit numeric default 0 check (credit >= 0),
  description text, -- Line item specific description
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Indexes
create index if not exists idx_ledger_date on accounting_ledger(transaction_date);
create index if not exists idx_journal_ledger_id on accounting_journal_lines(ledger_id);
create index if not exists idx_journal_account_id on accounting_journal_lines(account_id);

-- RLS
alter table accounting_accounts enable row level security;
alter table accounting_ledger enable row level security;
alter table accounting_journal_lines enable row level security;

-- Admin only policies (Simplified for this context)
create policy "Admins can manage accounts" on accounting_accounts for all using (true); 
create policy "Admins can manage ledger" on accounting_ledger for all using (true);
create policy "Admins can manage journal lines" on accounting_journal_lines for all using (true);
