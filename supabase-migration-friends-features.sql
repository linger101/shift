-- Shift — Friends features migration
-- Run this in a NEW query in the Supabase SQL Editor.
-- Safe to re-run (idempotent).

-- 1. Review replies (flat thread on any review)
create table if not exists public.review_replies (
  id uuid default gen_random_uuid() primary key,
  review_id uuid references public.reviews(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  username text not null,
  text text not null,
  created_at timestamp with time zone default now()
);

alter table public.review_replies enable row level security;

drop policy if exists "Replies are viewable by everyone" on public.review_replies;
create policy "Replies are viewable by everyone"
  on public.review_replies for select using (true);

drop policy if exists "Authenticated users can insert replies" on public.review_replies;
create policy "Authenticated users can insert replies"
  on public.review_replies for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own replies" on public.review_replies;
create policy "Users can delete their own replies"
  on public.review_replies for delete using (auth.uid() = user_id);

-- 2. Night Outs tables
create table if not exists public.night_outs (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references auth.users on delete cascade not null,
  name text not null,
  night_date date,
  status text default 'planning' check (status in ('planning', 'finalized', 'completed')),
  created_at timestamp with time zone default now()
);

create table if not exists public.night_out_members (
  id uuid default gen_random_uuid() primary key,
  night_out_id uuid references public.night_outs(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  added_by uuid references auth.users on delete set null,
  joined_at timestamp with time zone default now(),
  unique(night_out_id, user_id)
);

create table if not exists public.night_out_picks (
  id uuid default gen_random_uuid() primary key,
  night_out_id uuid references public.night_outs(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  bar_id integer not null,
  created_at timestamp with time zone default now(),
  unique(night_out_id, bar_id)
);

create table if not exists public.night_out_votes (
  id uuid default gen_random_uuid() primary key,
  night_out_id uuid references public.night_outs(id) on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  bar_id integer not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamp with time zone default now(),
  unique(night_out_id, user_id, bar_id)
);

-- 3. Membership helper (security-definer avoids recursive RLS)
create or replace function public.is_night_out_member(p_night_out_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.night_out_members
    where night_out_id = p_night_out_id and user_id = p_user_id
  ) or exists (
    select 1 from public.night_outs
    where id = p_night_out_id and creator_id = p_user_id
  );
$$;

-- 4. RLS
alter table public.night_outs enable row level security;
alter table public.night_out_members enable row level security;
alter table public.night_out_picks enable row level security;
alter table public.night_out_votes enable row level security;

drop policy if exists "Members can view night outs" on public.night_outs;
create policy "Members can view night outs"
  on public.night_outs for select using (
    auth.uid() = creator_id or public.is_night_out_member(id, auth.uid())
  );

drop policy if exists "Users can create night outs" on public.night_outs;
create policy "Users can create night outs"
  on public.night_outs for insert with check (auth.uid() = creator_id);

drop policy if exists "Creator can update night out" on public.night_outs;
create policy "Creator can update night out"
  on public.night_outs for update using (auth.uid() = creator_id);

drop policy if exists "Creator can delete night out" on public.night_outs;
create policy "Creator can delete night out"
  on public.night_outs for delete using (auth.uid() = creator_id);

drop policy if exists "Members can view membership" on public.night_out_members;
create policy "Members can view membership"
  on public.night_out_members for select using (
    public.is_night_out_member(night_out_id, auth.uid())
  );

drop policy if exists "Members can add members" on public.night_out_members;
create policy "Members can add members"
  on public.night_out_members for insert with check (
    public.is_night_out_member(night_out_id, auth.uid())
  );

drop policy if exists "Members can leave or be removed" on public.night_out_members;
create policy "Members can leave or be removed"
  on public.night_out_members for delete using (
    auth.uid() = user_id or exists (
      select 1 from public.night_outs
      where id = night_out_id and creator_id = auth.uid()
    )
  );

drop policy if exists "Members can view picks" on public.night_out_picks;
create policy "Members can view picks"
  on public.night_out_picks for select using (
    public.is_night_out_member(night_out_id, auth.uid())
  );

drop policy if exists "Members can add picks" on public.night_out_picks;
create policy "Members can add picks"
  on public.night_out_picks for insert with check (
    auth.uid() = user_id and public.is_night_out_member(night_out_id, auth.uid())
  );

drop policy if exists "Users can remove their own picks" on public.night_out_picks;
create policy "Users can remove their own picks"
  on public.night_out_picks for delete using (auth.uid() = user_id);

drop policy if exists "Members can view votes" on public.night_out_votes;
create policy "Members can view votes"
  on public.night_out_votes for select using (
    public.is_night_out_member(night_out_id, auth.uid())
  );

drop policy if exists "Members can vote" on public.night_out_votes;
create policy "Members can vote"
  on public.night_out_votes for insert with check (
    auth.uid() = user_id and public.is_night_out_member(night_out_id, auth.uid())
  );

drop policy if exists "Users can change their vote" on public.night_out_votes;
create policy "Users can change their vote"
  on public.night_out_votes for update using (auth.uid() = user_id);

drop policy if exists "Users can remove their vote" on public.night_out_votes;
create policy "Users can remove their vote"
  on public.night_out_votes for delete using (auth.uid() = user_id);

-- 5. Realtime — wrap each add in a DO block so "already in publication" errors don't abort the migration
do $$ begin
  alter publication supabase_realtime add table public.review_replies;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.night_outs;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.night_out_members;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.night_out_picks;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.night_out_votes;
exception when duplicate_object then null; end $$;
