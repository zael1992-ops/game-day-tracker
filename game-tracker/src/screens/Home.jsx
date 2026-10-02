import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="hero-screen" style={{ justifyContent: 'center' }}>
      <h1 className="hero-title">Game Tracker</h1>
      <div className="hero-underline" />
      <p className="hero-subtitle">A game tracking app built for flag football</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
        <Link to="/game/new" className="pill-button primary">Start new game</Link>
        <Link to="/teams" className="pill-button">Manage teams</Link>
        <Link to="/stats" className="pill-button">Statistics</Link>
      </div>
    </div>
  );
}
