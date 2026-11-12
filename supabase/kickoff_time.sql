-- Kickoff time for games.
-- created_at stays the true record of when a game was entered.
-- kickoff_at is the time shown in the game registry. The New Game screen
-- pre-fills it with the nearest 15-minute mark and lets you change it.
-- Safe to run more than once.

alter table games add column if not exists kickoff_at timestamptz;

-- Existing games: use the time they were created.
update games set kickoff_at = created_at where kickoff_at is null;

alter table games alter column kickoff_at set default now();
alter table games alter column kickoff_at set not null;
