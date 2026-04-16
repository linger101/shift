-- BarCrawl Boston — Supabase Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Profiles table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  favorites integer[] default '{}',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies: users can read all profiles but only update their own
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- 2. Reviews table
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  bar_id integer not null,
  user_id uuid references auth.users on delete cascade not null,
  username text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  text text not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.reviews enable row level security;

-- Policies: everyone can read reviews, authenticated users can insert
create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Authenticated users can insert reviews"
  on public.reviews for insert with check (auth.role() = 'authenticated');

-- 3. Auto-create profile on signup (trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', 'user_' || left(new.id::text, 8)));
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if it exists, then create
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Enable realtime for reviews (so friends see updates live)
alter publication supabase_realtime add table public.reviews;

-- 5. Friendships table
create table if not exists public.friendships (
  id uuid default gen_random_uuid() primary key,
  requester_id uuid references auth.users on delete cascade not null,
  addressee_id uuid references auth.users on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default now(),
  unique(requester_id, addressee_id)
);

alter table public.friendships enable row level security;

create policy "Users can view their own friendships"
  on public.friendships for select using (
    auth.uid() = requester_id or auth.uid() = addressee_id
  );

create policy "Authenticated users can send friend requests"
  on public.friendships for insert with check (auth.uid() = requester_id);

create policy "Addressee can update friendship status"
  on public.friendships for update using (auth.uid() = addressee_id);
