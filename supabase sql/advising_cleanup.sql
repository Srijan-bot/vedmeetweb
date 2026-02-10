-- Clean up Advising Feature
-- Drops all tables, functions, and types related to the advising feature

-- 1. Drop Tables (Cascade to remove dependencies like messages & tags)
drop table if exists session_messages cascade;
drop table if exists session_user_tags cascade;
drop table if exists advising_sessions cascade;

-- 2. Drop Functions
drop function if exists bulk_tag_users(uuid, uuid[]);
drop function if exists is_admin_or_advisor();

-- 3. Drop Extensions (Optional - only if you are sure no one else uses pgcrypto)
-- drop extension if exists pgcrypto; -- Safe to leave enabled usually
