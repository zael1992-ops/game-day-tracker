# Where design assets go

**`src/assets/`** (this folder) - for anything imported directly into a component:

```jsx
import logo from '../assets/logo.png';
<img src={logo} alt="Game Tracker" />
```

Vite processes these when you build (hashing, optimization). Use this for
custom button graphics, icons, team logos, anything a component references.

**`public/`** (project root) - for files referenced by a plain URL path,
untouched by the build:

```jsx
<img src="/team-flag.png" />
```

This is also where PWA icons and `manifest.json` live, since the browser
needs to fetch those by a fixed path, not through an import.

Rule of thumb: if a component imports it, it goes in `src/assets/`. If
something outside your React code needs to find it by path (manifest
icons, favicon), it goes in `public/`.
