import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';
import HeroBack from '../components/HeroBack.jsx';

export default function SignUp() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checkEmail, setCheckEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { data, error: signUpError } = await signUp(email, password);
    setSubmitting(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      navigate('/home');
    } else {
      // Email confirmation is on for this project - no session yet.
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <div className="hero-screen">
        <HeroBack to="/" />
        <h1 className="hero-title hero-title-sm">Check Your Email</h1>
        <div className="hero-underline" />
        <div className="hero-body">
          <p className="hero-text">We sent a confirmation link to {email}. Follow it, then come back and log in.</p>
          <Link to="/login" className="pill pill-primary">Go to log in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-screen">
      <HeroBack to="/" />
      <h1 className="hero-title">Sign Up</h1>
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
          minLength={6}
          autoComplete="new-password"
          placeholder="Password (6+ characters)"
          aria-label="Password, 6 or more characters"
          className="pill-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="hero-error">{error}</p>}
        <button type="submit" className="pill pill-primary" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="hero-footer">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
