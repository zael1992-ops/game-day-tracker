-- GM (admin) edit and delete access for GDay.
--
-- Run this AFTER admin_access.sql. Until now admins could only READ
-- everyone's data. This adds full control for admins over:
--   teams, people (player names/photos), roster slots, games and plays
-- so the GM can rename or delete any team, edit any roster, and delete
-- any game, no matter which account created it.
--
-- Regular users are unchanged: they can still only touch their own rows.
-- Safe to run more than once.

drop policy if exists "admins can manage all teams" on teams;
create policy "admins can manage all teams" on teams
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admins can manage all people" on people;
create policy "admins can manage all people" on people
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admins can manage all roster slots" on roster_slots;
create policy "admins can manage all roster slots" on roster_slots
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admins can manage all games" on games;
create policy "admins can manage all games" on games
  for all using (is_admin()) with check (is_admin());

drop policy if exists "admins can manage all plays" on plays;
create policy "admins can manage all plays" on plays
  for all using (is_admin()) with check (is_admin());
