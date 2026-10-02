import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

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
    <div className="hero-screen" style={{ justifyContent: 'flex-start' }}>
      <Link to="/" className="hero-link">&larr; Back</Link>
      <h1 className="hero-title" style={{ fontSize: 32, marginTop: 24 }}>Log in</h1>
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
          placeholder="Password"
          className="pill-select"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p style={{ color: '#ffb4b4', fontSize: 14, margin: 0 }}>{error}</p>}
        <button type="submit" className="pill-button mint" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="hero-subtitle" style={{ marginTop: 16 }}>
        No account yet? <Link to="/signup" style={{ color: '#fff' }}>Sign up</Link>
      </p>
    </div>
  );
}
