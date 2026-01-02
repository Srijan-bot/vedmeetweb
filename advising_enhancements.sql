-- Upgrade Schema for Enhanced Chat (Products & Mentions)

-- 1. Add metadata column for storing product details or rich content
alter table session_messages 
add column if not exists metadata jsonb default '{}'::jsonb;

-- 2. Update type check constraint to allow 'product'
-- We first drop the old constraint, then add a new one (or leave it open)
alter table session_messages 
drop constraint if exists session_messages_type_check;

alter table session_messages 
add constraint session_messages_type_check 
check (type in ('message', 'note', 'system', 'product'));
