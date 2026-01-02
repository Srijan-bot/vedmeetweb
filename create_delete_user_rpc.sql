-- Function to allow admins to delete users
create or replace function public.delete_user(target_user_id uuid)
returns void as $$
begin
  -- Check if the executing user is an admin
  -- We use a direct select from profiles, ensuring we are looking at the current user's role
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'superadmin', 'seo_writer') 
  ) then
    raise exception 'You do not have permission to delete users.';
  end if;

  -- Delete from auth.users (cascades to profiles)
  delete from auth.users where id = target_user_id;
end;
$$ language plpgsql security definer set search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO service_role;
