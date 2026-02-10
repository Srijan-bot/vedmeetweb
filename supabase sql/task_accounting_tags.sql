-- Add tags column to accounting_ledger
ALTER TABLE accounting_ledger ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
