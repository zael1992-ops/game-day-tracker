import { useInstallPrompt } from '../lib/installPrompt.js';

// Only renders when Chrome says the app can be installed and it isn't
// already running as the installed app.
export default function InstallButton() {
  const { canInstall, install } = useInstallPrompt();
  if (!canInstall) return null;
  return (
    <button type="button" onClick={install} className="pill pill-tertiary">
      Install app
    </button>
  );
}
