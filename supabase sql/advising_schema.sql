-- Advising System Schema
-- Assumption: 'profiles' table exists with 'id' (uuid) and 'role' (text)

-- 1. Enable required extension
create extension if not exists pgcrypto;

-- 2. Advising Sessions Table
create table if not exists advising_sessions (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    status text default 'active' check (status in ('active', 'archived', 'completed')),
    created_by uuid references auth.users(id) not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Index for listing sessions
create index if not exists idx_advising_sessions_created_by on advising_sessions(created_by);
create index if not exists idx_advising_sessions_status on advising_sessions(status);

-- 3. Session User Tags (Many-to-Many)
create table if not exists session_user_tags (
    session_id uuid references advising_sessions(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    assigned_at timestamptz default now(),
    assigned_by uuid references auth.users(id),
    primary key (session_id, user_id)
);

-- Index for finding sessions for a user
create index if not exists idx_session_user_tags_user_id on session_user_tags(user_id);

-- 4. Session Messages (Chat/Notes)
create table if not exists session_messages (
    id uuid default gen_random_uuid() primary key,
    session_id uuid references advising_sessions(id) on delete cascade not null,
    user_id uuid references auth.users(id) not null,
    content text not null,
    type text default 'message' check (type in ('message', 'note', 'system')),
    is_internal boolean default false, -- if true, only visible to admins
    created_at timestamptz default now()
);

-- Index for loading chat history
create index if not exists idx_session_messages_session_created on session_messages(session_id, created_at);

-- 5. RLS Policies

alter table advising_sessions enable row level security;
alter table session_user_tags enable row level security;
alter table session_messages enable row level security;

-- Helper function to check role (assuming profiles table)
create or replace function public.is_admin_or_advisor()
returns boolean as $$
declare
  user_role text;
begin
  select role into user_role from public.profiles where id = auth.uid();
  return user_role in ('admin', 'advisor');
end;
$$ language plpgsql security definer;

-- advising_sessions policies
create policy "Admins/Advisors can view all sessions"
    on advising_sessions for select
    using ( public.is_admin_or_advisor() );

create policy "Users can view sessions they are tagged in"
    on advising_sessions for select
    using (
        exists (
            select 1 from session_user_tags
            where session_id = advising_sessions.id
            and user_id = auth.uid()
        )
    );

create policy "Admins/Advisors can insert sessions"
    on advising_sessions for insert
    with check ( public.is_admin_or_advisor() );

create policy "Admins/Advisors can update sessions"
    on advising_sessions for update
    using ( public.is_admin_or_advisor() );

-- session_user_tags policies
create policy "Admins/Advisors can view all tags"
    on session_user_tags for select
    using ( public.is_admin_or_advisor() );

create policy "Users can view their own tags"
    on session_user_tags for select
    using ( user_id = auth.uid() );

create policy "Admins/Advisors can manage tags"
    on session_user_tags for all
    using ( public.is_admin_or_advisor() );

-- session_messages policies
create policy "Adoption: Admins/Advisors view all, Users view their sessions (non-internal)"
    on session_messages for select
    using (
        public.is_admin_or_advisor() 
        or (
            is_internal = false
            and exists (
                select 1 from session_user_tags
                where session_id = session_messages.session_id
                and user_id = auth.uid()
            )
        )
    );

create policy "Admins/Advisors can insert messages"
    on session_messages for insert
    with check ( public.is_admin_or_advisor() );

create policy "Users can insert messages to their sessions"
    on session_messages for insert
    with check (
        type = 'message' 
        and is_internal = false
        and exists (
            select 1 from session_user_tags
            where session_id = session_messages.session_id
            and user_id = auth.uid()
        )
    );
