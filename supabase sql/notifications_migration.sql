-- Create Notifications Table
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null, -- The recipient
  type text not null, -- 'tag', 'system_alert', etc.
  content text not null,
  link text, -- where to navigate on click
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  data jsonb -- extra metadata
);

-- Enable RLS
alter table notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Users can insert notifications"
  on notifications for insert
  with check (auth.role() = 'authenticated');
