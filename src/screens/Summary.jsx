import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AppScreen from '../components/AppScreen.jsx';
import ScoreBox from '../components/ScoreBox.jsx';
import { formatKickoff } from '../lib/kickoff.js';
import { getGame, listPlays, listTeams, listRosterSlots } from '../lib/dataStore.js';
import { tallyGame } from '../lib/statsHelpers.js';
import PlayByPlay from '../components/PlayByPlay.jsx';
import StatSheet from '../components/StatSheet.jsx';

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

  if (loading || !game) {
    return (
      <AppScreen title="Final Score" navActive="/home">
        <p className="empty-state">Loading summary...</p>
      </AppScreen>
    );
  }

  const nameA = teamA?.name || game.teamAName || 'Team 1';
  const nameB = teamB?.name || game.teamBName || 'Team 2';

  const tallyA = tallyGame(plays.filter((p) => p.side === 'A')).sort((a, b) => b.points - a.points);
  const tallyB = tallyGame(plays.filter((p) => p.side === 'B')).sort((a, b) => b.points - a.points);

  const status = STATUS[game.status] || { label: game.status, chip: 'chip-dark' };

  return (
    <AppScreen title="Final Score" navActive="/home">
      <ScoreBox nameA={nameA} nameB={nameB} scoreA={game.scoreA} scoreB={game.scoreB} logoA={teamA?.logo} logoB={teamB?.logo}>
        <span>{formatKickoff(game.kickoffAt)}</span>
        <span className={`chip ${status.chip}`}>{status.label}</span>
      </ScoreBox>

      {game.status === 'pending_confirmation' && (
        <>
          <p className="muted small" style={{ textAlign: 'center' }}>
            These stats don't count yet. A captain from either team needs to confirm the game first.
          </p>
          <Link to="/games/pending" className="btn btn-secondary">Review it now</Link>
        </>
      )}

      <h2 className="section-title">Stat Sheet</h2>
      <StatSheet nameA={nameA} nameB={nameB} rowsA={tallyA} rowsB={tallyB} namesA={namesA} namesB={namesB} />

      <h2 className="section-title">Play by Play</h2>
      <PlayByPlay plays={plays} readOnly namesA={namesA} namesB={namesB} teamAName={nameA} teamBName={nameB} />

      <Link to="/stats" className="btn btn-primary">View Statistics</Link>
      <Link to="/home" className="btn btn-secondary">Back to Home</Link>
    </AppScreen>
  );
}

const STATUS = {
  pending_confirmation: { label: 'Waiting for review', chip: 'chip-amber' },
  confirmed: { label: 'Confirmed', chip: 'chip-green' },
  rejected: { label: 'Rejected', chip: 'chip-red' },
  active: { label: 'In progress', chip: 'chip-dark' },
  abandoned: { label: 'Abandoned', chip: 'chip-dark' },
};
