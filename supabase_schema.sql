-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create or Update Products Table
create table if not exists products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  image text,
  category text,
  rating numeric default 0,
  reviews integer default 0,
  brand text,
  stock_status text default 'In Stock',
  features text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add new columns for enhanced product details (safe alters)
alter table products 
add column if not exists ingredients text,
add column if not exists benefits text,
add column if not exists usage text,
add column if not exists stock_quantity integer default 0,
add column if not exists disc_price numeric,
add column if not exists discount_percentage integer default 0,
add column if not exists concern text;

-- 6. Create Categories Table
create table if not exists categories (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  image text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 7. Create Concerns Table
create table if not exists concerns (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Create Doctors Table
create table if not exists doctors (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  specialty text,
  experience text,
  rating numeric default 5.0,
  image text,
  price numeric default 50,
  bio text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Create Blogs Table
create table if not exists blogs (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  author text,
  category text,
  image text,
  date date default current_date,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Create Leads Table
create table if not exists leads (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  phone text not null,
  status text default 'New', -- New, Success, Loss, Scheduled
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Create Site Settings Table
create table if not exists site_settings (
  key text primary key,
  value text
);

-- Seed Site Settings
insert into site_settings (key, value) values 
('hero_image', 'https://images.unsplash.com/photo-1606893603348-12c5b3b72c49?auto=format&fit=crop&q=80&w=2000'),
('hero_title', 'Pure Ayurveda, Delivered.'),
('hero_subtitle', 'Authentic remedies sourced from nature, crafted for your modern lifestyle.')
on conflict (key) do nothing;
