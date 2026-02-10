-- Fix Product Reviews Foreign Key
-- We want to link reviews to 'public.profiles' instead of 'auth.users' directly,
-- so that we can easily fetch the user's name (full_name) when displaying reviews.

-- 1. Drop the old FK
ALTER TABLE public.product_reviews DROP CONSTRAINT IF EXISTS product_reviews_user_id_fkey;

-- 2. Add new FK to profiles
ALTER TABLE public.product_reviews
    ADD CONSTRAINT product_reviews_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

-- 3. Verify RLS is still good (it relies on auth.uid() = user_id, which is still valid since profiles.id == auth.users.id)
