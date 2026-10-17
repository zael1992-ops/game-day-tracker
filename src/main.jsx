import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './lib/installPrompt.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Non-fatal - the app still works without it, Android just
      // won't offer the native "Install app" prompt.
    });
  });
}
