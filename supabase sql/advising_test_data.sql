-- Test Data for Advising Feature

-- 1. Create Mock Profiles (Users need to exist in auth.users ideally, but for testing just inserting into profiles if relying on join)
-- NOTE: In a real scenario, you'd insert into auth.users. Here we assume existing users or just test constraints.

-- Insert test sessions
insert into advising_sessions (id, title, description, created_by, status)
values
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Career Guidance Q1', 'Focus on quarterly goals', auth.uid(), 'active'),
    ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Wellness Check', 'Weekly health checkup', auth.uid(), 'active'),
    ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Archive Review', 'Old session', auth.uid(), 'archived');

-- Insert session messages
insert into session_messages (session_id, user_id, content, type)
values
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', auth.uid(), 'Welcome to the session!', 'system'),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', auth.uid(), 'Please introduce yourselves.', 'message');
