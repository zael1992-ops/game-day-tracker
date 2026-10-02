import { Link, useNavigate } from 'react-router-dom';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="hero-screen" style={{ justifyContent: 'center' }}>
      <h1 className="hero-title">Game Day</h1>
      <div className="hero-underline" />
      <p className="hero-subtitle">A game tracking app built specifically for flag football</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center' }}>
        <Link to="/signup" className="pill-button mint">Sign up</Link>
        <Link to="/login" className="pill-button navy">Log in</Link>
        <button className="pill-button charcoal" onClick={() => navigate('/guest/new')}>
          Try a new game
        </button>
      </div>

      <p className="hero-subtitle" style={{ marginTop: 24, maxWidth: 280 }}>
        Trying it out doesn't need an account, nothing about that game is saved once you're done.
      </p>
    </div>
  );
}
