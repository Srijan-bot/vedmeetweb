-- Force Supabase Schema Cache Refresh
-- Sometimes 'NOTIFY pgrst' doesn't work if run from a different client.
-- Making a physical schema change pushes a refresh reliably.

CREATE TABLE IF NOT EXISTS public._force_refresh_trigger_table (
    id serial primary key
);

DROP TABLE IF EXISTS public._force_refresh_trigger_table;
