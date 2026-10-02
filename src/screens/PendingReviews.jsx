import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyPendingGames, listTeams, confirmGame, rejectGame } from '../lib/dataStore.js';

export default function PendingReviews() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listMyPendingGames(), listTeams()]).then(([g, t]) => {
      setGames(g);
      setTeams(t);
      setLoading(false);
    });
  }, []);

  async function handleConfirm(gameId) {
    await confirmGame(gameId);
    setGames(games.filter((g) => g.id !== gameId));
  }

  async function handleReject(gameId) {
    if (!window.confirm("Reject this game? It won't count toward anyone's stats.")) return;
    await rejectGame(gameId);
    setGames(games.filter((g) => g.id !== gameId));
  }

  if (loading) return <div className="stack">Loading...</div>;

  return (
    <div className="stack">
      <Link to="/home">&larr; Home</Link>
      <h2>Pending reviews</h2>
      {games.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>Nothing waiting on you.</p>}
      {games.map((g) => {
        const nameA = teams.find((t) => t.id === g.teamAId)?.name || g.teamAName || 'Team 1';
        const nameB = teams.find((t) => t.id === g.teamBId)?.name || g.teamBName || 'Team 2';
        return (
          <div key={g.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
            <strong>{nameA} {g.scoreA} - {g.scoreB} {nameB}</strong>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => handleConfirm(g.id)} style={{ flex: 1 }}>Confirm</button>
              <button
                onClick={() => handleReject(g.id)}
                style={{ flex: 1, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              >
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
