-- Game Tracker schema for Supabase (Postgres)
--
-- Run this once in the SQL Editor of your Supabase project. It creates
-- the four tables that mirror src/lib/models.js, and locks every one of
-- them down with Row Level Security so a logged-in user can only ever
-- read or write rows they own. Supabase's built-in auth.users table
-- already covers "Person" for a logged-in user - no separate table
-- needed for that.
--
-- "Try a New Game" (guest mode) never touches this database at all -
-- that stays entirely in memory on the client and is thrown away when
-- the session ends.

create extension if not exists "pgcrypto";

-- TEAMS ------------------------------------------------------------
create table teams (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  color text,
  logo text,
  created_at timestamptz not null default now()
);

alter table teams enable row level security;

create policy "owner can manage own teams"
  on teams for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- PEOPLE -------------------------------------------------------------
-- A rostered player who may or may not be the logged-in user. Separate
-- from auth.users because a team's roster can include people who never
-- sign up (unrostered-by-name, tracked by jersey number only).
create table people (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table people enable row level security;

create policy "owner can manage own people"
  on people for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- ROSTER SLOTS ---------------------------------------------------------
-- Links a Person to a Team with a jersey number. person_id can be null
-- (a game-scoped placeholder for an unrostered number).
create table roster_slots (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  team_id uuid not null references teams(id) on delete cascade,
  person_id uuid references people(id) on delete set null,
  number text not null,
  is_captain boolean not null default false,
  created_at timestamptz not null default now()
);

alter table roster_slots enable row level security;

create policy "owner can manage own roster slots"
  on roster_slots for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- GAMES ----------------------------------------------------------------
-- status: 'active' -> 'pending_confirmation' -> 'confirmed'
create table games (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  team_a_id uuid references teams(id) on delete set null,
  team_b_id uuid references teams(id) on delete set null,
  team_a_name text,
  team_b_name text,
  score_a integer not null default 0,
  score_b integer not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

alter table games enable row level security;

create policy "owner can manage own games"
  on games for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- PLAYS ------------------------------------------------------------------
-- side: 'A' | 'B'
-- type: 'TD' | 'PAT' | 'SAFETY' | 'INTERCEPTION' | 'SACK'
-- sub_type (TD only): 'run' | 'pass' | 'int_return'
create table plays (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  game_id uuid not null references games(id) on delete cascade,
  side text not null,
  type text not null,
  sub_type text,
  primary_number text not null,
  secondary_number text,
  primary_slot_id uuid references roster_slots(id) on delete set null,
  secondary_slot_id uuid references roster_slots(id) on delete set null,
  points integer not null default 0,
  sequence bigint not null,
  is_undone boolean not null default false,
  created_at timestamptz not null default now()
);

alter table plays enable row level security;

create policy "owner can manage own plays"
  on plays for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Helpful indexes for the lookups the app does most often.
create index teams_owner_idx on teams (owner_id);
create index people_owner_idx on people (owner_id);
create index roster_slots_team_idx on roster_slots (team_id);
create index games_owner_idx on games (owner_id);
create index plays_game_idx on plays (game_id);
