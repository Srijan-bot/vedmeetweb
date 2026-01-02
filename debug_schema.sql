-- Debug Script: Check Table Schema
-- Run this in Supabase SQL Editor

select column_name, data_type, is_nullable
from information_schema.columns 
where table_name = 'accounting_ledger';
