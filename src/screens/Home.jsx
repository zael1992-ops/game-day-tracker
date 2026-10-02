import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function Home() {
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogOut() {
    await logOut();
    navigate('/');
  }

  return (
    <div className="hero-screen" style={{ justifyContent: 'center' }}>
      <h1 className="hero-title">Game Tracker</h1>
      <div className="hero-underline" />
      <p className="hero-subtitle">{user?.email}</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
        <Link to="/game/new" className="pill-button mint">Start new game</Link>
        <Link to="/teams" className="pill-button navy">Manage teams</Link>
        <Link to="/stats" className="pill-button charcoal">Statistics</Link>
        <button onClick={handleLogOut} className="pill-button" style={{ opacity: 0.85 }}>Log out</button>
      </div>
    </div>
  );
}
