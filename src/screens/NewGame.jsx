import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroBack from '../components/HeroBack.jsx';
import { listTeams, insertGame } from '../lib/dataStore.js';
import { roundToQuarterHour, toLocalInputValue } from '../lib/kickoff.js';

export default function NewGame() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [starting, setStarting] = useState(false);
  // Pre-filled with the nearest 15-minute mark; editable for late starts
  // or games logged after the fact.
  const [kickoff, setKickoff] = useState(() => toLocalInputValue(roundToQuarterHour()));

  useEffect(() => {
    listTeams().then(setTeams);
  }, []);

  async function startGame() {
    setStarting(true);
    const game = await insertGame({
      teamAId: teamAId || null,
      teamBId: teamBId || null,
      teamAName: teamAId ? null : 'Team 1',
      teamBName: teamBId ? null : 'Team 2',
      kickoffAt: kickoff ? new Date(kickoff).toISOString() : null,
    });
    navigate(`/game/${game.id}/live`);
  }

  return (
    <div className="hero-screen">
      <HeroBack to="/home" label="Home" />
      <h1 className="hero-title">New Game</h1>

      <div className="hero-body">
        <label htmlFor="team-a" className="hero-label">Local</label>
        <select id="team-a" className="pill-select" value={teamAId} onChange={(e) => setTeamAId(e.target.value)}>
          <option value="">Team 1</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <label htmlFor="team-b" className="hero-label">Visiting</label>
        <select id="team-b" className="pill-select" value={teamBId} onChange={(e) => setTeamBId(e.target.value)}>
          <option value="">Team 2</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <label htmlFor="kickoff" className="hero-label">Kickoff</label>
        <input
          id="kickoff"
          type="datetime-local"
          step={900}
          className="pill-select"
          style={{ colorScheme: 'light' }}
          value={kickoff}
          onChange={(e) => setKickoff(e.target.value)}
        />

        <button type="button" className="pill pill-primary" style={{ marginTop: 24 }} onClick={startGame} disabled={starting}>
          {starting ? 'Starting...' : 'Start Game'}
        </button>
        <p className="hero-note">Team names can still be edited once you're in the live game hub.</p>
      </div>
    </div>
  );
}
