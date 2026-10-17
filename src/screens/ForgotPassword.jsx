import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

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

  const formStyle = { width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 };

  return (
    <div className="hero-screen" style={{ justifyContent: 'flex-start' }}>
      <Link to="/login" className="hero-link">&larr; Back</Link>
      <h1 className="hero-title" style={{ fontSize: 32, marginTop: 24 }}>Reset password</h1>
      <div className="hero-underline" />

      {step === 'email' ? (
        <form onSubmit={sendCode} style={formStyle}>
          <p className="hero-subtitle" style={{ margin: 0 }}>Enter your email and we'll send you a code to reset your password.</p>
          <input
            type="email"
            required
            placeholder="Email"
            className="pill-select"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {error && <p style={{ color: '#ffb4b4', fontSize: 14, margin: 0 }}>{error}</p>}
          <button type="submit" className="pill-button mint" disabled={busy}>
            {busy ? 'Sending...' : 'Send code'}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} style={formStyle}>
          {notice && <p className="hero-subtitle" style={{ margin: 0 }}>{notice}</p>}
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            required
            placeholder="6-digit code"
            className="pill-select"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="New password"
            className="pill-select"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirm new password"
            className="pill-select"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <p style={{ color: '#ffb4b4', fontSize: 14, margin: 0 }}>{error}</p>}
          <button type="submit" className="pill-button mint" disabled={busy}>
            {busy ? 'Saving...' : 'Set new password'}
          </button>
          <button type="button" className="pill-button" onClick={sendCode} disabled={busy} style={{ opacity: 0.85 }}>
            Send a new code
          </button>
        </form>
      )}
    </div>
  );
}
