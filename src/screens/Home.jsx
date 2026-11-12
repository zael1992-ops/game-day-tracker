import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { listActiveGames, listMyPendingGames } from '../lib/dataStore.js';
import InstallButton from '../components/InstallButton.jsx';

export default function Home() {
  const { logOut } = useAuth();
  const navigate = useNavigate();
  const [activeCount, setActiveCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    listActiveGames().then((g) => setActiveCount(g.length));
    listMyPendingGames().then((g) => setPendingCount(g.length));
  }, []);

  async function handleLogOut() {
    await logOut();
    navigate('/');
  }

  const plural = (n) => (n === 1 ? '' : 's');

  return (
    <div className="hero-screen">
      <h1 className="hero-title">Game Day</h1>
      <p className="hero-tagline">Game Tracking App<br />Built just for you</p>

      <div className="hero-body hero-body-bottom">
        {activeCount > 0 && (
          <Link to="/games/active" className="pill pill-status">
            <strong>{activeCount} game{plural(activeCount)} in progress</strong>
            <span>Tap to resume</span>
          </Link>
        )}
        {pendingCount > 0 && (
          <Link to="/games/pending" className="pill pill-status alert">
            <strong>{pendingCount} game{plural(pendingCount)} waiting for review</strong>
            <span>Tap to review</span>
          </Link>
        )}
        {(activeCount > 0 || pendingCount > 0) && <div style={{ height: 8 }} />}
        <Link to="/game/new" className="pill pill-primary">Start New Game</Link>
        <Link to="/teams" className="pill pill-tertiary">Manage Teams</Link>
        <Link to="/stats" className="pill pill-tertiary">Statistics</Link>
        <InstallButton />
        <button type="button" onClick={handleLogOut} className="hero-link" style={{ marginTop: 8 }}>Log out</button>
      </div>
    </div>
  );
}
