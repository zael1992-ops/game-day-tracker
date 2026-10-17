import { useInstallPrompt } from '../lib/installPrompt.js';

// Only renders when Chrome says the app can be installed and it isn't
// already running as the installed app.
export default function InstallButton() {
  const { canInstall, install } = useInstallPrompt();
  if (!canInstall) return null;
  return (
    <button type="button" onClick={install} className="pill-button" style={{ background: 'var(--color-lime)', borderColor: 'var(--color-lime)', color: '#12332a' }}>
      Install app
    </button>
  );
}
