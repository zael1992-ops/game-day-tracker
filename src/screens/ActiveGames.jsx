import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listActiveGames, listTeams, listPlaysForGames, abandonGame } from '../lib/dataStore.js';
import GameCard from '../components/GameCard.jsx';

export default function ActiveGames() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [scores, setScores] = useState({}); // gameId -> { A, B }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [g, t] = await Promise.all([listActiveGames(), listTeams()]);
      // A game's saved score is only written when it ends, so for games
      // still in progress the current score comes from their plays.
      const plays = await listPlaysForGames(g.map((game) => game.id));
      const totals = {};
      for (const p of plays) {
        totals[p.gameId] = totals[p.gameId] || { A: 0, B: 0 };
        totals[p.gameId][p.side] += p.points;
      }
      setGames(g);
      setTeams(t);
      setScores(totals);
      setLoading(false);
    })();
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
        const teamA = teams.find((t) => t.id === g.teamAId);
        const teamB = teams.find((t) => t.id === g.teamBId);
        return (
          <GameCard
            key={g.id}
            nameA={teamA?.name || g.teamAName || 'Team 1'}
            nameB={teamB?.name || g.teamBName || 'Team 2'}
            logoA={teamA?.logo}
            logoB={teamB?.logo}
            scoreA={scores[g.id]?.A ?? 0}
            scoreB={scores[g.id]?.B ?? 0}
            caption={`Started ${new Date(g.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`}
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate(`/game/${g.id}/live`)} style={{ flex: 1 }}>Resume</button>
              <button
                onClick={() => handleAbandon(g.id)}
                style={{ flex: 1, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              >
                Abandon
              </button>
            </div>
          </GameCard>
        );
      })}
    </div>
  );
}
