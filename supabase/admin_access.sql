-- Admin access for Game Tracker.
--
-- Run this AFTER schema.sql. It adds one more rule on top of the
-- existing "you can only see your own rows" policies: anyone listed
-- in the `admins` table can also SELECT every row, from every user.
--
-- This is read-only on purpose. An admin can see every team, game,
-- and play across every account, but still can't edit or delete
-- someone else's data, only their own. If you also want edit/delete
-- access as an admin, say so and I'll extend this.

create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Deliberately no policies on this table itself, so it can't be read
-- or written to from the app at all, not even by an admin. The only
-- way in or out is this SQL editor.
alter table admins enable row level security;

-- security definer means this function runs with elevated privilege,
-- bypassing the admins table's own lockdown, so policies on OTHER
-- tables can safely call it to check "is the current user an admin?"
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

grant execute on function is_admin() to authenticated;

-- One additional SELECT-only policy per table. Postgres combines
-- multiple policies for the same action with OR, so this adds "or
-- you're an admin" alongside the existing "or you own the row" rule,
-- it doesn't replace anything already there.
drop policy if exists "admins can read all teams" on teams;
create policy "admins can read all teams" on teams for select using (is_admin());

drop policy if exists "admins can read all people" on people;
create policy "admins can read all people" on people for select using (is_admin());

drop policy if exists "admins can read all roster slots" on roster_slots;
create policy "admins can read all roster slots" on roster_slots for select using (is_admin());

drop policy if exists "admins can read all games" on games;
create policy "admins can read all games" on games for select using (is_admin());

drop policy if exists "admins can read all plays" on plays;
create policy "admins can read all plays" on plays for select using (is_admin());

-- Last step (do this manually, once): make yourself an admin.
-- 1. Sign up for a real account through the app's Sign Up screen,
--    using whichever email you want to be your admin login.
-- 2. Come back here and run, with your real email:
--
-- insert into admins (user_id)
-- select id from auth.users where email = 'you@example.com';
