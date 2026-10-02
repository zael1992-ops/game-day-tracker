// Minimal service worker. Doesn't cache anything yet, just having a
// registered service worker with a fetch handler is one of the
// requirements Android/Chrome checks before it offers the real
// "Install app" prompt (iOS doesn't require this for Add to Home
// Screen). Offline caching can be layered in here later if wanted.
self.addEventListener('fetch', () => {});
