import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listConfirmedGames, listTeams, listRosterSlots, listPlaysForGames } from '../lib/dataStore.js';
import { buildTeamTotals } from '../lib/statsHelpers.js';

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
  if (games.length === 0) return <p style={{ color: 'var(--color-text-muted)' }}>No confirmed games yet.</p>;

  return (
    <div className="stack" style={{ padding: 0 }}>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Every confirmed game. Tap one to see its stat sheet.</p>
      {games.map((g) => {
        const teamA = teams.find((t) => t.id === g.teamAId);
        const teamB = teams.find((t) => t.id === g.teamBId);
        return <GameCard key={g.id} game={g} teamA={teamA} teamB={teamB} />;
      })}
    </div>
  );
}

function GameCard({ game, teamA, teamB }) {
  const nameA = teamA?.name || game.teamAName || 'Team 1';
  const nameB = teamB?.name || game.teamBName || 'Team 2';

  return (
    <Link to={`/game/${game.id}/summary`} style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
      <div style={{ border: '1px solid var(--color-text)', borderRadius: 'var(--radius)', padding: '16px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <GameCardTeam name={nameA} logo={teamA?.logo} score={game.scoreA} color="var(--color-team-a)" />
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-text-muted)' }}>VS</span>
          <GameCardTeam name={nameB} logo={teamB?.logo} score={game.scoreB} color="var(--color-team-b)" />
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 12 }}>
          {new Date(game.createdAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}

function GameCardTeam({ name, logo, score, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 110 }}>
      {logo ? (
        <img src={logo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
      ) : (
        <span style={{ width: 40, height: 40, borderRadius: 8, background: color, display: 'inline-block' }} />
      )}
      <strong
        style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.2, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
      >
        {name}
      </strong>
      <span style={{ fontSize: 22, fontWeight: 700 }}>{score}</span>
    </div>
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
    <div className="stack" style={{ padding: 0 }}>
      <select value={selectedTeamId} onChange={(e) => selectTeam(e.target.value)}>
        <option value="">Choose a team...</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {loadingTeam && <p>Loading...</p>}

      {!loadingTeam && sortedRows && sortedRows.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)' }}>This team has no roster yet, add players under Manage teams.</p>
      )}

      {!loadingTeam && sortedRows && sortedRows.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 14 }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={{ ...thStyle, textAlign: 'left' }}>Name</th>
                {STAT_COLUMNS.map((col) => (
                  <th key={col.key} style={thStyle}>
                    <button
                      onClick={() => sortBy(col.key)}
                      style={{
                        border: 'none',
                        background: 'none',
                        padding: 0,
                        font: 'inherit',
                        fontWeight: sortKey === col.key ? 700 : 400,
                        color: sortKey === col.key ? 'var(--color-text)' : 'var(--color-text-muted)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col.label}{sortKey === col.key ? (sortDir === 'desc' ? ' \u2193' : ' \u2191') : ''}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r) => (
                <tr key={r.number} style={{ borderTop: '1px solid var(--color-border)' }}>
                  <td style={tdStyle}>#{r.number}</td>
                  <td style={{ ...tdStyle, textAlign: 'left' }}>{r.name || <span style={{ color: 'var(--color-text-muted)' }}>&mdash;</span>}</td>
                  {STAT_COLUMNS.map((col) => (
                    <td key={col.key} style={tdStyle}>{r[col.key] || 0}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const thStyle = { padding: '6px 10px', textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' };
const tdStyle = { padding: '8px 10px', textAlign: 'center' };
