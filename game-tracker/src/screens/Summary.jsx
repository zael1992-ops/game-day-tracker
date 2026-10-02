import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storage } from '../lib/storage.js';

export default function Summary() {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);

  useEffect(() => {
    setGame(storage.getGames().find((g) => g.id === gameId) || null);
  }, [gameId]);

  if (!game) return <div className="stack">Game not found.</div>;

  return (
    <div className="stack">
      <h2>Final score</h2>
      <p style={{ fontSize: 20 }}>
        {game.teamAName || 'Team 1'} {game.scoreA} - {game.scoreB} {game.teamBName || 'Team 2'}
      </p>
      <p style={{ color: 'var(--color-text-muted)' }}>
        {game.status === 'pending_confirmation'
          ? 'These stats aren\u2019t counted yet. A captain from either team needs to open Manage teams, select their team, and confirm this game under "Pending games to review."'
          : `Status: ${game.status}`}
      </p>
      {game.status === 'pending_confirmation' && (
        <Link to="/teams"><button style={{ width: '100%' }}>Go review it now</button></Link>
      )}
      <Link to="/stats"><button style={{ width: '100%' }}>View statistics</button></Link>
      <Link to="/"><button style={{ width: '100%' }}>Back to home</button></Link>
    </div>
  );
}
