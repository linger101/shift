-- Shift — Night Out invite links
-- Run this in a NEW query in the Supabase SQL Editor. Safe to re-run.

-- 1. Add invite_token column (unique, auto-generated)
alter table public.night_outs
  add column if not exists invite_token uuid not null default gen_random_uuid();

-- Backfill any rows that existed before the default (shouldn't be any, but safe)
update public.night_outs set invite_token = gen_random_uuid() where invite_token is null;

-- Ensure uniqueness
do $$ begin
  alter table public.night_outs add constraint night_outs_invite_token_key unique (invite_token);
exception when duplicate_table then null; when duplicate_object then null; end $$;

-- 2. Preview function: returns the night's name given an invite token
--    (SECURITY DEFINER so non-members can see what they're being invited to)
create or replace function public.get_night_out_by_invite(p_token uuid)
returns table (id uuid, name text, night_date date)
language sql
security definer
stable
as $$
  select id, name, night_date from public.night_outs where invite_token = p_token;
$$;

-- 3. Redeem function: adds the current user as a member, returns the night's id
create or replace function public.redeem_night_out_invite(p_token uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_night_out_id uuid;
  v_user uuid := auth.uid();
begin
  if v_user is null then
    return null;
  end if;

  select id into v_night_out_id from public.night_outs where invite_token = p_token;
  if v_night_out_id is null then
    return null;
  end if;

  insert into public.night_out_members (night_out_id, user_id, added_by)
  values (v_night_out_id, v_user, v_user)
  on conflict (night_out_id, user_id) do nothing;

  return v_night_out_id;
end;
$$;

grant execute on function public.get_night_out_by_invite(uuid) to anon, authenticated;
grant execute on function public.redeem_night_out_invite(uuid) to authenticated;
