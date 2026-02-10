-- RPC Function to delete a user (Auth + Profile)
create or replace function delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- 1. Authorization Check: Ensure the requester is an admin
  if not exists (
    select 1 from profiles 
    where id = auth.uid() 
    and role = 'admin'
  ) then
    raise exception 'Access Denied: Only admins can delete users.';
  end if;

  -- 2. Delete from auth.users (This usually cascades to profiles if set up correctly)
  -- If not cascading, we manually delete profile first
  delete from public.profiles where id = target_user_id;
  delete from auth.users where id = target_user_id;
  
end;
$$;
