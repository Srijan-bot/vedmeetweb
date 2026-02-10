-- DIAGNOSTIC SCRIPT
-- Run this to see exactly what tables exist in your database.

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
