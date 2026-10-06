-- Live game sharing for Game Tracker.
--
-- Run this AFTER schema.sql. It lets the owner of a game turn on a
-- share link, so anyone holding that link can watch the score and
-- play-by-play without an account.
--
-- How it stays safe:
--   * share_token is null until the owner taps "Share live", and goes
--     back to null when they stop sharing. No token, no access.
--   * Tokens are long random strings (enforced below), so they can't
--     be guessed.
--   * Spectators never read the tables directly. RLS stays exactly as
--     it was. The only way in is get_shared_game(), which returns a
--     fixed, limited shape: team names, logos, status, and plays by
--     jersey number. No player names, photos, or roster data.

alter table games add column if not exists share_token text unique;

alter table games drop constraint if exists games_share_token_length;
alter table games add constraint games_share_token_length
  check (share_token is null or length(share_token) >= 32);

create or replace function get_shared_game(p_token text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'status', g.status,
    'teamAName', coalesce(ta.name, g.team_a_name, 'Team 1'),
    'teamBName', coalesce(tb.name, g.team_b_name, 'Team 2'),
    'teamALogo', ta.logo,
    'teamBLogo', tb.logo,
    'createdAt', g.created_at,
    'plays', coalesce((
      select json_agg(json_build_object(
        'id', p.id,
        'side', p.side,
        'type', p.type,
        'subType', p.sub_type,
        'primaryNumber', p.primary_number,
        'secondaryNumber', p.secondary_number,
        'points', p.points,
        'sequence', p.sequence
      ) order by p.sequence)
      from plays p
      where p.game_id = g.id and not p.is_undone
    ), '[]'::json)
  )
  from games g
  left join teams ta on ta.id = g.team_a_id
  left join teams tb on tb.id = g.team_b_id
  where p_token is not null
    and length(p_token) >= 32
    and g.share_token = p_token
    and g.status in ('active', 'pending_confirmation', 'confirmed');
$$;

revoke all on function get_shared_game(text) from public;
grant execute on function get_shared_game(text) to anon, authenticated;
