-- Run this in your Supabase SQL Editor to migrate your database

-- 1. Convert 'category' column from text to text[] (array of text)
-- Handles existing data by converting single values to single-item arrays
ALTER TABLE products 
  ALTER COLUMN category TYPE text[] 
  USING CASE 
    WHEN category IS NULL OR category = '' THEN '{}'::text[] 
    ELSE ARRAY[category] 
  END;

-- 2. Convert 'concern' column from text to text[] (array of text)
ALTER TABLE products 
  ALTER COLUMN concern TYPE text[] 
  USING CASE 
    WHEN concern IS NULL OR concern = '' THEN '{}'::text[] 
    ELSE ARRAY[concern] 
  END;

-- 3. Set defaults to empty array
ALTER TABLE products ALTER COLUMN category SET DEFAULT '{}';
ALTER TABLE products ALTER COLUMN concern SET DEFAULT '{}';
