import { useEffect, useState } from 'react';
import AppScreen from '../components/AppScreen.jsx';
import { listConfirmedGames, listTeams, listRosterSlots, listPlaysForGames } from '../lib/dataStore.js';
import { buildTeamTotals } from '../lib/statsHelpers.js';
import GameCard from '../components/GameCard.jsx';
import StatTable from '../components/StatTable.jsx';
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
      ...(totals[s.number] || { td: 0, passTD: 0, ints: 0, sacks: 0, safeties: 0, conversions: 0, points: 0 }),
    }));
    setRows(merged);
    setLoadingTeam(false);
  }

  return (
    <>
      <select className="field" aria-label="Team" value={selectedTeamId} onChange={(e) => selectTeam(e.target.value)}>
        <option value="">Choose a team...</option>
        {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
      </select>

      {loadingTeam && <p className="empty-state">Loading...</p>}

      {!loadingTeam && rows && (
        <StatTable key={selectedTeamId} rows={rows} emptyText="This team has no roster yet. Add players under Manage Teams." />
      )}
    </>
  );
}
