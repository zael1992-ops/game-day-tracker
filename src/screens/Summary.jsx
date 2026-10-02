import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getGame, listPlays, listTeams, listRosterSlots } from '../lib/dataStore.js';
import { tallyGame, describeTeamRow } from '../lib/statsHelpers.js';
import PlayByPlay from '../components/PlayByPlay.jsx';

export default function Summary() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [plays, setPlays] = useState([]);
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [namesA, setNamesA] = useState({});
  const [namesB, setNamesB] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [foundGame, foundPlays, teams] = await Promise.all([getGame(gameId), listPlays(gameId), listTeams()]);
      const foundTeamA = teams.find((t) => t.id === foundGame.teamAId) || null;
      const foundTeamB = teams.find((t) => t.id === foundGame.teamBId) || null;

      setGame(foundGame);
      setPlays(foundPlays.filter((p) => !p.isUndone));
      setTeamA(foundTeamA);
      setTeamB(foundTeamB);

      if (foundTeamA) {
        const slots = await listRosterSlots(foundTeamA.id);
        setNamesA(Object.fromEntries(slots.filter((s) => s.personName).map((s) => [s.number, s.personName])));
      }
      if (foundTeamB) {
        const slots = await listRosterSlots(foundTeamB.id);
        setNamesB(Object.fromEntries(slots.filter((s) => s.personName).map((s) => [s.number, s.personName])));
      }
      setLoading(false);
    })();
  }, [gameId]);

  if (loading || !game) return <div className="stack">Loading summary...</div>;

  const nameA = teamA?.name || game.teamAName || 'Team 1';
  const nameB = teamB?.name || game.teamBName || 'Team 2';

  const tallyA = tallyGame(plays.filter((p) => p.side === 'A')).sort((a, b) => b.points - a.points);
  const tallyB = tallyGame(plays.filter((p) => p.side === 'B')).sort((a, b) => b.points - a.points);

  return (
    <div className="stack">
      <h2>Final score</h2>
      <p style={{ fontSize: 20 }}>
        {nameA} {game.scoreA} - {game.scoreB} {nameB}
      </p>
      <p style={{ color: 'var(--color-text-muted)' }}>
        {game.status === 'pending_confirmation'
          ? "These stats aren't counted yet. A captain from either team needs to open Manage teams, select their team, and confirm this game under \"Pending games to review.\""
          : `Status: ${game.status}`}
      </p>
      {game.status === 'pending_confirmation' && (
        <Link to="/teams"><button style={{ width: '100%' }}>Go review it now</button></Link>
      )}

      <h3 style={{ marginBottom: 0 }}>Stat sheet</h3>
      <TeamStatSheet name={nameA} rows={tallyA} names={namesA} accent="var(--color-team-a)" />
      <TeamStatSheet name={nameB} rows={tallyB} names={namesB} accent="var(--color-team-b)" />

      <h3 style={{ marginBottom: 0 }}>Full play registry</h3>
      <PlayByPlay plays={plays} readOnly />

      <Link to="/stats"><button style={{ width: '100%' }}>View statistics</button></Link>
      <Link to="/home"><button style={{ width: '100%' }}>Back to home</button></Link>
    </div>
  );
}

function TeamStatSheet({ name, rows, names, accent }) {
  return (
    <div className="stack" style={{ padding: 0 }}>
      <strong>{name}</strong>
      {rows.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No stats logged.</p>}
      {rows.map((r) => (
        <div key={r.number} className="stat-row" style={{ '--stat-accent': accent }}>
          <span className="stat-row-name">#{r.number}{names[r.number] ? ` ${names[r.number]}` : ''}</span>
          <span className="stat-row-detail">{describeTeamRow(r)}</span>
        </div>
      ))}
    </div>
  );
}
