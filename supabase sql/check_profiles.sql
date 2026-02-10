-- Fixed: Check Profiles Data (Removed full_name)
select * from profiles limit 10;

-- Insert dummy users with existing columns only
insert into profiles (id, email, role)
values 
  (gen_random_uuid(), 'testuser@example.com', 'user'),
  (gen_random_uuid(), 'advisor@example.com', 'advisor')
on conflict (id) do nothing;
