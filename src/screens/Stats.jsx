import { useEffect, useState } from 'react';
import AppScreen from '../components/AppScreen.jsx';
import { listConfirmedGames, listTeams, listRosterSlots, listPlaysForGames } from '../lib/dataStore.js';
import { buildTeamTotals } from '../lib/statsHelpers.js';
import GameCard from '../components/GameCard.jsx';
import { formatKickoff } from '../lib/kickoff.js';

export default function Stats() {
  const [tab, setTab] = useState('games'); // 'games' | 'team'
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listConfirmedGames(), listTeams()]).then(([g, t]) => {
      setGames(g);
      setTeams(t);
      setLoading(false);
    });
  }, []);

  return (
    <AppScreen title="Statistics">
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'games'} className={`tab${tab === 'games' ? ' is-active' : ''}`} onClick={() => setTab('games')}>Game Stats</button>
        <button type="button" role="tab" aria-selected={tab === 'team'} className={`tab${tab === 'team' ? ' is-active' : ''}`} onClick={() => setTab('team')}>Team Stats</button>
      </div>

      {loading && <p className="empty-state">Loading...</p>}

      {!loading && tab === 'games' && <GamesRegistry games={games} teams={teams} />}
      {!loading && tab === 'team' && <TeamStats teams={teams} />}
    </AppScreen>
  );
}

function GamesRegistry({ games, teams }) {
  if (games.length === 0) return <p className="empty-state">No confirmed games yet.</p>;

  return (
    <>
      <p className="muted small">Every confirmed game. Tap one to see its stat sheet.</p>
      {games.map((g) => {
        const teamA = teams.find((t) => t.id === g.teamAId);
        const teamB = teams.find((t) => t.id === g.teamBId);
        return (
          <GameCard
            key={g.id}
            to={`/game/${g.id}/summary`}
            nameA={teamA?.name || g.teamAName || 'Team 1'}
            nameB={teamB?.name || g.teamBName || 'Team 2'}
            logoA={teamA?.logo}
            logoB={teamB?.logo}
            scoreA={g.scoreA}
            scoreB={g.scoreB}
            caption={formatKickoff(g.kickoffAt)}
          />
        );
      })}
    </>
  );
}

const STAT_COLUMNS = [
  { key: 'points', label: 'PTS' },
  { key: 'td', label: 'TD' },
  { key: 'passTD', label: 'Pass TD' },
  { key: 'ints', label: 'INT' },
  { key: 'sacks', label: 'Sack' },
  { key: 'safeties', label: 'Safety' },
  { key: 'conversions', label: 'Conv' },
];

function TeamStats({ teams }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [rows, setRows] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [sortKey, setSortKey] = useState('points');
  const [sortDir, setSortDir] = useState('desc');

  async function selectTeam(teamId) {
    setSelectedTeamId(teamId);
    if (!teamId) {
      setRows(null);
      return;
    }
    setLoadingTeam(true);
    const allConfirmed = await listConfirmedGames();
    const teamGames = allConfirmed.filter((g) => g.teamAId === teamId || g.teamBId === teamId);
    const [plays, slots] = await Promise.all([
      listPlaysForGames(teamGames.map((g) => g.id)),
      listRosterSlots(teamId),
    ]);
    const totals = buildTeamTotals(teamGames, plays, teamId);
    const merged = slots.map((s) => ({
      number: s.number,
      name: s.personName,
      ...(totals[s.number] || { td: 0, passTD: 0, ints: 0, sacks: 0, safeties: 0, conversions: 0, points: 0 }),
    }));
    setRows(merged);
    setLoadingTeam(false);
  }

  function sortBy(key) {
    if (key === sortKey) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sortedRows = rows
    ? [...rows].sort((a, b) => (sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]))
    : null;

  return (
    <>
      <select className="field" aria-label="Team" value={selectedTeamId} onChange={(e) => selectTeam(e.target.value)}>
        <option value="">Choose a team...</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {loadingTeam && <p className="empty-state">Loading...</p>}

      {!loadingTeam && sortedRows && sortedRows.length === 0 && (
        <p className="empty-state">This team has no roster yet. Add players under Manage Teams.</p>
      )}

      {!loadingTeam && sortedRows && sortedRows.length > 0 && (
        <div className="stat-table-wrap">
          <table className="stat-table">
            <thead>
              <tr>
                <th className="col-player">Player</th>
                {STAT_COLUMNS.map((col) => (
                  <th key={col.key} className={sortKey === col.key ? 'is-sorted' : undefined} aria-sort={sortKey === col.key ? (sortDir === 'desc' ? 'descending' : 'ascending') : undefined}>
                    <button type="button" onClick={() => sortBy(col.key)}>
                      {col.label}{sortKey === col.key ? (sortDir === 'desc' ? ' \u2193' : ' \u2191') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={r.number}>
                  <td className="col-player">#{r.number} {r.name || ''}</td>
                  {STAT_COLUMNS.map((col) => (
                    <td key={col.key} style={col.key === 'points' ? { fontWeight: 700 } : undefined}>{r[col.key] || 0}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
