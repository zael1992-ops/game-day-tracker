import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import HeroBack from '../components/HeroBack.jsx';

export default function LogIn() {
  const { logIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error: logInError } = await logIn(email, password);
    setSubmitting(false);
    if (logInError) {
      setError(logInError.message);
      return;
    }
    navigate('/home');
  }

  return (
    <div className="hero-screen">
      <HeroBack to="/" />
      <h1 className="hero-title">Log In</h1>
      <div className="hero-underline" />

      <form onSubmit={handleSubmit} className="hero-body">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          aria-label="Email"
          className="pill-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          aria-label="Password"
          className="pill-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="hero-error">{error}</p>}
        <button type="submit" className="pill pill-primary" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
        <Link to="/forgot-password" className="hero-link">Forgot password?</Link>
      </form>

      <p className="hero-footer">
        New here? <Link to="/signup">Create an account</Link>
      </p>
    </div>
  );
}
