-- Create product_reviews table
create table if not exists public.product_reviews (
  id uuid not null default uuid_generate_v4(),
  product_id bigint not null,
  user_id uuid not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  review_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  constraint product_reviews_pkey primary key (id),
  constraint product_reviews_product_id_fkey foreign key (product_id) references public.products(id),
  constraint product_reviews_user_id_fkey foreign key (user_id) references auth.users(id)
);

-- Enable RLS
alter table public.product_reviews enable row level security;

-- Policies
create policy "Reviews are viewable by everyone"
  on public.product_reviews for select
  using (true);

create policy "Users can insert their own reviews"
  on public.product_reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reviews"
  on public.product_reviews for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reviews"
  on public.product_reviews for delete
  using (auth.uid() = user_id);

-- Function to calculate average rating
create or replace function public.update_product_rating()
returns trigger as $$
declare
  _avg_rating numeric;
  _count integer;
begin
  select avg(rating), count(*)
  into _avg_rating, _count
  from public.product_reviews
  where product_id = new.product_id;

  update public.products
  set rating = coalesce(_avg_rating, 0),
      reviews = coalesce(_count, 0)
  where id = new.product_id;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_review_change on public.product_reviews;
create trigger on_review_change
  after insert or update or delete
  on public.product_reviews
  for each row
  execute function public.update_product_rating();
