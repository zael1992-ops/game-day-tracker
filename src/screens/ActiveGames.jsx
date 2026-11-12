import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppScreen from '../components/AppScreen.jsx';
import { listActiveGames, listTeams, listPlaysForGames, abandonGame } from '../lib/dataStore.js';
import GameCard from '../components/GameCard.jsx';
import { formatKickoff } from '../lib/kickoff.js';

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

  return (
    <AppScreen title="Games in Progress" navActive="/home">
      {loading && <p className="empty-state">Loading...</p>}
      {!loading && games.length === 0 && <p className="empty-state">No games in progress.</p>}
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
            caption={`Kickoff ${formatKickoff(g.kickoffAt)}`}
          >
            <div className="btn-row">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate(`/game/${g.id}/live`)}>Resume</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleAbandon(g.id)}>Abandon</button>
            </div>
          </GameCard>
        );
      })}
    </AppScreen>
  );
}
