import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppScreen from '../components/AppScreen.jsx';
import GameCard from '../components/GameCard.jsx';
import { formatKickoff } from '../lib/kickoff.js';
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

  return (
    <AppScreen title="Pending Review" navActive="/home">
      {loading && <p className="empty-state">Loading...</p>}
      {!loading && games.length === 0 && <p className="empty-state">Nothing waiting on you.</p>}
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
            scoreA={g.scoreA}
            scoreB={g.scoreB}
            caption={formatKickoff(g.kickoffAt)}
          >
            <p className="small">Final stats need your OK before they count.</p>
            <Link to={`/game/${g.id}/summary`} className="text-button" style={{ alignSelf: 'flex-start', fontSize: 14 }}>View stat sheet</Link>
            <div className="btn-row">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => handleConfirm(g.id)}>Confirm</button>
              <button type="button" className="btn btn-danger btn-sm" onClick={() => handleReject(g.id)}>Reject</button>
            </div>
          </GameCard>
        );
      })}
    </AppScreen>
  );
}
