-- RPC for Bulk Tagging (Server-Side Validation)

create or replace function bulk_tag_users(
    p_session_id uuid,
    p_user_ids uuid[]
)
returns void
language plpgsql
security definer
as $$
declare
    v_user_id uuid;
begin
    -- 1. Check permission
    if not public.is_admin_or_advisor() then
        raise exception 'Access denied: Admins or advisors only';
    end if;

    -- 2. Verify session exists
    if not exists (select 1 from advising_sessions where id = p_session_id) then
        raise exception 'Session not found';
    end if;

    -- 3. Loop and upsert (skip duplicates)
    -- Efficient bulk insert with on conflict
    insert into session_user_tags (session_id, user_id, assigned_by)
    select 
        p_session_id,
        u.id,
        auth.uid()
    from unnest(p_user_ids) as u(id)
    where exists (select 1 from auth.users where id = u.id) -- Verify user exists in auth
    on conflict (session_id, user_id) do nothing;

end;
$$;
