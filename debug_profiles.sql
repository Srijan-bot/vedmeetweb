-- check policies
select * from pg_policies where tablename = 'profiles';

-- check triggers
select 
    t.tgname, 
    p.proname as function_name,
    pg_get_triggerdef(t.oid) as trigger_def
from pg_trigger t
join pg_proc p on t.tgfoid = p.oid
where t.tgrelid = 'public.profiles'::regclass;

-- check if trigger function 'handle_new_user' or similar exists and its content
select 
    p.proname, 
    pg_get_functiondef(p.oid) 
from pg_proc p 
where p.proname like '%handle_new_user%' OR p.proname like '%on_auth_user_created%';
