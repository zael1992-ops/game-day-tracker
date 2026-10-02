import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listConfirmedGames, listTeams, listRosterSlots, listPlaysForGames } from '../lib/dataStore.js';
import { buildTeamTotals, describeTeamRow } from '../lib/statsHelpers.js';

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
    <div className="stack">
      <Link to="/home">&larr; Home</Link>
      <h2>Statistics</h2>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setTab('games')} style={tab === 'games' ? activeTabStyle : undefined}>Game stats</button>
        <button onClick={() => setTab('team')} style={tab === 'team' ? activeTabStyle : undefined}>Team stats</button>
      </div>

      {loading && <p>Loading...</p>}

      {!loading && tab === 'games' && <GamesRegistry games={games} teams={teams} />}
      {!loading && tab === 'team' && <TeamStats teams={teams} />}
    </div>
  );
}

const activeTabStyle = { background: 'var(--color-text)', color: '#fff', borderColor: 'var(--color-text)' };

function GamesRegistry({ games, teams }) {
  if (games.length === 0) return <p>No confirmed games yet.</p>;

  return (
    <div className="stack" style={{ padding: 0 }}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Every confirmed game. Tap one to see its stat sheet.</p>
      {games.map((g) => {
        const nameA = teams.find((t) => t.id === g.teamAId)?.name || g.teamAName || 'Team 1';
        const nameB = teams.find((t) => t.id === g.teamBId)?.name || g.teamBName || 'Team 2';
        return (
          <Link key={g.id} to={`/game/${g.id}/summary`} style={{ textDecoration: 'none' }}>
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '10px 14px', color: 'var(--color-text)' }}>
              <strong>{nameA} {g.scoreA} - {g.scoreB} {nameB}</strong>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>{new Date(g.createdAt).toLocaleDateString()}</div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function TeamStats({ teams }) {
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [rows, setRows] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(false);

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
      photo: s.personPhoto,
      ...(totals[s.number] || { td: 0, passTD: 0, ints: 0, sacks: 0, safeties: 0, conversions: 0, points: 0 }),
    }));
    merged.sort((a, b) => b.points - a.points);
    setRows(merged);
    setLoadingTeam(false);
  }

  return (
    <div className="stack" style={{ padding: 0 }}>
      <select value={selectedTeamId} onChange={(e) => selectTeam(e.target.value)}>
        <option value="">Choose a team...</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {loadingTeam && <p>Loading...</p>}

      {!loadingTeam && rows && rows.length === 0 && <p>This team has no roster yet, add players under Manage teams.</p>}

      {!loadingTeam && rows && rows.map((r) => (
        <div key={r.number} className="stat-row" style={{ '--stat-accent': 'var(--color-team-a)' }}>
          <span className="stat-row-name">#{r.number}{r.name ? ` ${r.name}` : ''}</span>
          <span className="stat-row-detail">{describeTeamRow(r)}</span>
        </div>
      ))}
    </div>
  );
}
