-- Adds the kickoff time to shared game links, so a finished game's
-- Watch page shows when it was played. Run AFTER kickoff_time.sql.
-- Safe to run more than once. Everything else is unchanged from
-- live_sharing.sql: jersey numbers only, no player names or photos.

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
    'kickoffAt', coalesce(g.kickoff_at, g.created_at),
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
