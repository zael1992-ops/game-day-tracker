import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listActiveGames, listTeams, abandonGame } from '../lib/dataStore.js';

export default function ActiveGames() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listActiveGames(), listTeams()]).then(([g, t]) => {
      setGames(g);
      setTeams(t);
      setLoading(false);
    });
  }, []);

  async function handleAbandon(gameId) {
    if (!window.confirm("Abandon this game? You won't be able to resume it, and it won't count toward any stats.")) return;
    await abandonGame(gameId);
    setGames(games.filter((g) => g.id !== gameId));
  }

  if (loading) return <div className="stack">Loading...</div>;

  return (
    <div className="stack">
      <Link to="/home">&larr; Home</Link>
      <h2>Games in progress</h2>
      {games.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>No games in progress.</p>}
      {games.map((g) => {
        const nameA = teams.find((t) => t.id === g.teamAId)?.name || g.teamAName || 'Team 1';
        const nameB = teams.find((t) => t.id === g.teamBId)?.name || g.teamBName || 'Team 2';
        return (
          <div key={g.id} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '10px 14px' }}>
            <strong>{nameA} {g.scoreA} - {g.scoreB} {nameB}</strong>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '4px 0 10px' }}>
              Started {new Date(g.createdAt).toLocaleString()}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate(`/game/${g.id}/live`)} style={{ flex: 1 }}>Resume</button>
              <button
                onClick={() => handleAbandon(g.id)}
                style={{ flex: 1, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              >
                Abandon
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
