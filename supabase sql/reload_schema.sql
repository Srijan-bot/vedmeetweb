-- Force Supabase API to refresh its knowledge of the database tables
NOTIFY pgrst, 'reload schema';
