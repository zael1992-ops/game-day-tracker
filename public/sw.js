// Service worker for Game Day.
//
// Chrome wants a service worker that actually handles page loads before
// it treats the site as an installable app. This one does the minimum
// useful thing: pages always come from the network (so every deploy shows
// up right away), and only if the phone is offline does it fall back to a
// saved copy of the app shell. Scores, plays and logins always go straight
// to Supabase and are never cached here.
const CACHE = 'gameday-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add('/')));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return; // everything else: browser default
  event.respondWith(
    fetch(event.request).catch(() => caches.match('/'))
  );
});
