import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storage } from '../lib/storage.js';
import { createGame } from '../lib/models.js';

export default function NewGame() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');

  useEffect(() => {
    setTeams(storage.getTeams());
  }, []);

  function startGame() {
    const games = storage.getGames();
    const game = createGame({ teamAId: teamAId || null, teamBId: teamBId || null });
    if (!teamAId) game.teamAName = 'Team 1';
    if (!teamBId) game.teamBName = 'Team 2';
    storage.saveGames([...games, game]);
    navigate(`/game/${game.id}/live`);
  }

  return (
    <div className="hero-screen" style={{ justifyContent: 'flex-start' }}>
      <Link to="/" className="hero-link">&larr; Home</Link>
      <h1 className="hero-title" style={{ fontSize: 32, marginTop: 24 }}>New game</h1>
      <div className="hero-underline" />

      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>Local team</label>
        <select className="pill-select" value={teamAId} onChange={(e) => setTeamAId(e.target.value)}>
          <option value="">Team 1 (not saved)</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <label style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 8 }}>Visiting team</label>
        <select className="pill-select" value={teamBId} onChange={(e) => setTeamBId(e.target.value)}>
          <option value="">Team 2 (not saved)</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <p className="hero-subtitle" style={{ maxWidth: 320, margin: '16px 0' }}>
          Team names can still be edited once you're in the live game hub.
        </p>

        <button className="pill-button primary" onClick={startGame}>Start game</button>
      </div>
    </div>
  );
}
