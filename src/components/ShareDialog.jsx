import { useState } from 'react';
import Dialog from './Dialog.jsx';

// Share pop-up for a game, used live (Live hub) and after the game
// (Game summary). The link opens the public Watch page, which shows
// jersey numbers only, never player names or photos.
//
// On phones that support it, "Share" opens the phone's own share sheet
// (WhatsApp, Messages...). Everywhere else it falls back to copying.
export default function ShareDialog({ shareToken, finished = false, title, onStart, onStop, onClose }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // HashRouter: the watch page lives after the #, on the same domain.
  const link = shareToken ? `${window.location.origin}${window.location.pathname}#/watch/${shareToken}` : '';
  const canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    }
    setBusy(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Couldn\'t copy automatically. Press and hold the link to copy it.');
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: title || 'GDay game', url: link });
    } catch (err) {
      // Closing the share sheet without picking anything isn't an error.
      if (err?.name !== 'AbortError') setError('Couldn\'t open sharing. Copy the link instead.');
    }
  }

  const body = shareToken
    ? finished
      ? 'Anyone with this link can see the final score, stat sheet and play by play. No account needed.'
      : 'Anyone with this link can watch the score and play by play. No account needed.'
    : finished
      ? "Create a link anyone can open to see this game's final score, stat sheet and play by play. They'll see jersey numbers, but not player names or photos. You can turn it off any time."
      : "Create a link anyone can open to follow this game live. They'll see team names, the score, and plays by jersey number, but not player names or photos. You can turn it off any time.";

  return (
    <Dialog title={finished ? 'Share Game' : 'Share Live Game'} body={body}>
      {shareToken ? (
        <>
          <div className="share-link">{link}</div>
          {canNativeShare && <button type="button" className="btn btn-primary" onClick={nativeShare}>Share</button>}
          <button type="button" className={`btn ${canNativeShare ? 'btn-secondary' : 'btn-primary'}`} onClick={copyLink}>
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button type="button" className="btn btn-danger" onClick={() => run(onStop)} disabled={busy}>Stop Sharing</button>
        </>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => run(onStart)} disabled={busy}>
          {busy ? 'Creating...' : 'Create Link'}
        </button>
      )}
      {error && <p className="error-text">{error}</p>}
      <button type="button" className="dialog-link" onClick={onClose}>Close</button>
    </Dialog>
  );
}
