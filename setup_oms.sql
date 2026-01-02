-- MASTER SETUP SCRIPT FOR OMS
-- Run this in Supabase SQL Editor

\ir accounting_schema.sql
\ir inventory_extension.sql
\ir oms_schema.sql
\ir oms_functions.sql

-- Note: In Supabase SQL Editor, you might need to copy-paste the contents of the individual files if \ir is not supported.
-- The files are:
-- 1. accounting_schema.sql
-- 2. inventory_extension.sql
-- 3. oms_schema.sql
-- 4. oms_functions.sql
