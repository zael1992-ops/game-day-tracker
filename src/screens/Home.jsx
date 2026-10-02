import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import { listActiveGames, listMyPendingGames } from '../lib/dataStore.js';

export default function Home() {
  const { user, logOut } = useAuth();
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

  return (
    <div className="hero-screen" style={{ justifyContent: 'center' }}>
      <h1 className="hero-title">Game Tracker</h1>
      <div className="hero-underline" />
      <p className="hero-subtitle">{user?.email}</p>

      {(activeCount > 0 || pendingCount > 0) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 320, marginBottom: 8 }}>
          {activeCount > 0 && (
            <Link
              to="/games/active"
              className="pill-button"
              style={{ background: 'var(--color-lime)', borderColor: 'var(--color-lime)', color: '#12332a' }}
            >
              {activeCount} game{activeCount === 1 ? '' : 's'} in progress, tap to resume
            </Link>
          )}
          {pendingCount > 0 && (
            <Link
              to="/games/pending"
              className="pill-button"
              style={{ background: 'var(--color-rose)', borderColor: 'var(--color-rose)', color: '#fff' }}
            >
              {pendingCount} game{pendingCount === 1 ? '' : 's'} waiting for review
            </Link>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
        <Link to="/game/new" className="pill-button mint">Start new game</Link>
        <Link to="/teams" className="pill-button navy">Manage teams</Link>
        <Link to="/stats" className="pill-button charcoal">Statistics</Link>
        <button onClick={handleLogOut} className="pill-button" style={{ opacity: 0.85 }}>Log out</button>
      </div>
    </div>
  );
}
