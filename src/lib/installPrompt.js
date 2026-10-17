import { useEffect, useState } from 'react';

// Chrome fires `beforeinstallprompt` when it considers the app installable
// as a real app (full screen, own icon in the app drawer). We hold on to
// that event so an "Install app" button can trigger the proper install,
// instead of relying on the browser menu, where "Add to Home screen" only
// makes a shortcut.
//
// This module is imported in main.jsx before React renders, because the
// event can fire before any screen has mounted.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); // stop Chrome's mini banner, we show our own button
  deferredPrompt = event;
  notify();
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  notify();
});

export function isRunningAsApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export function useInstallPrompt() {
  const [, rerender] = useState(0);

  useEffect(() => {
    const fn = () => rerender((n) => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null; // a prompt can only be used once
    notify();
  }

  return { canInstall: Boolean(deferredPrompt) && !isRunningAsApp(), install };
}
