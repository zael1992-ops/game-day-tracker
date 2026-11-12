import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import HeroBack from '../components/HeroBack.jsx';

// Password reset with a 6-digit code instead of a link. A link would have
// to land back inside the app's #/ routes, which is fragile, and a code
// works even if the email is opened on a different device.
//
// Requires the Supabase "Reset password" email template to include
// {{ .Token }} (see the setup notes that came with this update).
const MIN_PASSWORD = 6;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // email | code
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode(e) {
    e?.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    const { error: sendError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setBusy(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setStep('code');
    setNotice(`If an account exists for ${email.trim()}, a 6-digit code is on its way. Check spam too.`);
  }

  async function resetPassword(e) {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('Passwords don\'t match.');
      return;
    }
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'recovery',
    });
    if (verifyError) {
      setBusy(false);
      setError('That code is wrong or expired. Check it, or send a new one.');
      return;
    }
    // verifyOtp signed the user in, so now the password can be changed.
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    navigate('/home');
  }

  return (
    <div className="hero-screen">
      <HeroBack to="/login" />
      <h1 className="hero-title hero-title-sm">Reset Password</h1>
      <div className="hero-underline" />

      {step === 'email' ? (
        <form onSubmit={sendCode} className="hero-body">
          <p className="hero-text">Enter your email and we'll send you a code to reset your password.</p>
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
          {error && <p className="hero-error">{error}</p>}
          <button type="submit" className="pill pill-primary" disabled={busy}>
            {busy ? 'Sending...' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="hero-body">
          {notice && <p className="hero-text">{notice}</p>}
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            placeholder="6-digit code"
            aria-label="6-digit code"
            className="pill-input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="New password (6+ characters)"
            aria-label="New password"
            className="pill-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
            aria-label="Confirm new password"
            className="pill-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p className="hero-error">{error}</p>}
          <button type="submit" className="pill pill-primary" disabled={busy}>
            {busy ? 'Saving...' : 'Set new password'}
          </button>
          <button type="button" className="pill pill-secondary" onClick={sendCode} disabled={busy}>
            Send a new code
          </button>
        </form>
      )}

      <p className="hero-footer">
        {step === 'email' ? 'Remembered it?' : 'Changed your mind?'} <Link to="/login">{step === 'email' ? 'Log in' : 'Back to log in'}</Link>
      </p>
    </div>
  );
}
