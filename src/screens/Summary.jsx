import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import AppScreen from '../components/AppScreen.jsx';
import ScoreBox from '../components/ScoreBox.jsx';
import { formatKickoff } from '../lib/kickoff.js';
import { getGame, listPlays, listTeams, listRosterSlots, enableGameSharing, disableGameSharing, deleteGame } from '../lib/dataStore.js';
import { HeaderAction } from '../components/GameHeader.jsx';
import ShareDialog from '../components/ShareDialog.jsx';
import { tallyGame } from '../lib/statsHelpers.js';
import PlayByPlay from '../components/PlayByPlay.jsx';
import GameStats from '../components/GameStats.jsx';

export default function Summary() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const [plays, setPlays] = useState([]);
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [namesA, setNamesA] = useState({});
  const [namesB, setNamesB] = useState({});
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

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
  // Rejected and abandoned games can't be viewed through a link.
  const shareable = ['active', 'pending_confirmation', 'confirmed'].includes(game.status);

  const canDelete = isAdmin || (user && game.ownerId === user.id);

  async function handleDelete() {
    setShowDelete(false);
    try {
      await deleteGame(gameId);
      navigate('/stats', { replace: true });
    } catch (err) {
      alert(`Couldn't delete the game. ${err.message}`);
    }
  }

  async function startSharing() {
    const token = await enableGameSharing(gameId);
    setGame((prev) => ({ ...prev, shareToken: token }));
  }

  async function stopSharing() {
    await disableGameSharing(gameId);
    setGame((prev) => ({ ...prev, shareToken: null }));
  }

  return (
    <AppScreen
      title="Final Score"
      navActive="/home"
      right={shareable ? (
        <HeaderAction onClick={() => setShowShare(true)} active={Boolean(game.shareToken)}>
          {game.shareToken ? 'Shared' : 'Share'}
        </HeaderAction>
      ) : null}
    >
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
      <GameStats nameA={nameA} nameB={nameB} rowsA={tallyA} rowsB={tallyB} namesA={namesA} namesB={namesB} />

      <h2 className="section-title">Play by Play</h2>
      <PlayByPlay plays={plays} readOnly namesA={namesA} namesB={namesB} teamAName={nameA} teamBName={nameB} />

      <Link to="/stats" className="btn btn-primary">View Statistics</Link>
      <Link to="/home" className="btn btn-secondary">Back to Home</Link>

      {canDelete && (
        <button type="button" className="text-button text-button-danger" style={{ alignSelf: 'center', marginTop: 8 }} onClick={() => setShowDelete(true)}>
          Delete game
        </button>
      )}

      {showDelete && (
        <ConfirmDialog
          title="Delete This Game?"
          message="Its plays and stats are removed from every total, for good."
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      {showShare && (
        <ShareDialog
          finished
          shareToken={game.shareToken}
          title={`${nameA} ${game.scoreA} - ${game.scoreB} ${nameB}`}
          onStart={startSharing}
          onStop={stopSharing}
          onClose={() => setShowShare(false)}
        />
      )}
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
