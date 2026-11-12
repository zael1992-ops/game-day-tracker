import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import InstallButton from '../components/InstallButton.jsx';

export default function Welcome() {
  const { user, loading } = useAuth();

  // Wait for Supabase to finish checking for a saved session, so the
  // Welcome buttons don't flash on screen before the redirect.
  if (loading) return <div className="hero-screen" />;

  // Already logged in: skip Welcome and go straight to Home.
  if (user) return <Navigate to="/home" replace />;

  return (
    <div className="hero-screen">
      <h1 className="hero-title">Game Day</h1>
      <p className="hero-tagline">Game Tracking App<br />Built just for you</p>

      <div className="hero-body hero-body-bottom">
        <Link to="/signup" className="pill pill-primary">Create Account</Link>
        <Link to="/login" className="pill pill-secondary">Sign In</Link>
        <Link to="/guest/new" className="pill pill-tertiary">Try as Guest</Link>
        <p className="hero-note">Trying it out doesn't need an account. Nothing about that game is saved once you're done.</p>
        <InstallButton />
      </div>
    </div>
  );
}
