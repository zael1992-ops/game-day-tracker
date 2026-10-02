import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

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
      <div className="hero-screen" style={{ justifyContent: 'center' }}>
        <h1 className="hero-title" style={{ fontSize: 28 }}>Check your email</h1>
        <div className="hero-underline" />
        <p className="hero-subtitle">We sent a confirmation link to {email}. Follow it, then come back and log in.</p>
        <Link to="/login" className="pill-button">Go to log in</Link>
      </div>
    );
  }

  return (
    <div className="hero-screen" style={{ justifyContent: 'flex-start' }}>
      <Link to="/" className="hero-link">&larr; Back</Link>
      <h1 className="hero-title" style={{ fontSize: 32, marginTop: 24 }}>Sign up</h1>
      <div className="hero-underline" />

      <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          required
          placeholder="Email"
          className="pill-select"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="Password (6+ characters)"
          className="pill-select"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p style={{ color: '#ffb4b4', fontSize: 14, margin: 0 }}>{error}</p>}
        <button type="submit" className="pill-button mint" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="hero-subtitle" style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login" style={{ color: '#fff' }}>Log in</Link>
      </p>
    </div>
  );
}
