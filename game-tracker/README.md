# Game Tracker

Live flag football game tracker, built as a learning project. React + Vite,
routed as a web app, meant to be installed as a PWA (Add to Home Screen)
rather than shipped through an app store.

## Running it

```
npm install
npm run dev
```

Then open the local URL it prints (also works fine from your phone if it's
on the same network - Vite will show a network address too, or use
`npm run dev -- --host` to expose it).

## Folder structure

```
game-tracker/
├── index.html            entry HTML, PWA manifest link
├── public/
│   └── manifest.json      PWA config - icons are still a TODO
├── src/
│   ├── main.jsx           React root
│   ├── App.jsx            routes - this is the map of every screen
│   ├── styles/
│   │   └── tokens.css      colors, spacing, base button/input styles
│   ├── lib/
│   │   ├── models.js       the schema: Person, RosterSlot, Team, Game, Play
│   │   └── storage.js      localStorage read/write - this IS the autosave
│   ├── components/
│   │   ├── NumberPad.jsx     jersey-number entry modal
│   │   ├── ConfirmDialog.jsx generic yes/no prompt (exit, end game)
│   │   └── PlayByPlay.jsx    play list with per-play undo (the X)
│   ├── screens/
│   │   ├── Home.jsx
│   │   ├── ManageTeams.jsx   team + roster CRUD, pending-game review
│   │   ├── NewGame.jsx       pick saved teams or default Team 1/2
│   │   ├── LiveHub.jsx       the core scoring screen
│   │   ├── Summary.jsx       shown right after End Game
│   │   └── Stats.jsx         confirmed-game stat tallies
│   └── assets/
│       └── README.md         where to put your own images/icons
```

## What's deliberately simplified for this MVP

- **Stats are grouped by jersey number, not by a linked Person yet.**
  `Play.primarySlotId`/`secondarySlotId` exist in the schema for this, but
  nothing currently fills them in. Once you build the "link a roster
  number to a saved Person" flow in `ManageTeams`, update `Stats.jsx` to
  group by `personId` instead so a player's stats can follow them across
  every team they're on.
- **No resume-after-exit.** Exiting `LiveHub` mid-game navigates away, and
  though everything up to that point is saved, there's currently no way to
  reopen that specific game and keep adding plays. Games list + "resume"
  is a natural next step once the core loop feels solid.
- **Single-confirmer game review.** Any captain who opens a pending game
  under `ManageTeams` can confirm it, no dual sign-off.
- **Season/week filtering** isn't built into `Stats.jsx` yet - `Game`
  already has a `createdAt` timestamp, so this is a date-range filter to
  add, not a schema change.

## Next steps, roughly in order

1. Wire up roster-number-to-Person linking, backfill `primarySlotId`
2. Add a "reject / re-tag the other team" path to the pending review flow
3. Build the resume-a-game list
4. Add real PWA icons and test Add to Home Screen on iOS + Android
5. Layer in date-range filters on the Stats screen
