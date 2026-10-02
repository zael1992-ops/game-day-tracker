# Game Tracker

Live flag football game tracker, built as a learning project. React + Vite,
routed as a web app, meant to be installed as a PWA (Add to Home Screen)
rather than shipped through an app store.

## Running it

```
npm install
npm run dev
```

Then open the local URL it prints.

## Backend: Supabase

Real accounts (teams, rosters, games, stats) are stored in Supabase, a
hosted Postgres database with built-in auth. You need a `.env` file with
your project's URL and anon/publishable key:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

See `.env.example`. The schema lives in `supabase/schema.sql` - run it
once in your project's SQL Editor before using the app. It creates
`teams`, `people`, `roster_slots`, `games`, `plays`, each with Row Level
Security so a logged-in user can only ever see their own rows.

Two optional follow-up migrations, run the same way, in the same SQL
Editor:
- `supabase/admin_access.sql` - lets a specific account see every
  team/game across every user (read-only), see that file for setup.
- `supabase/add_person_photos.sql` - adds the `photo` column used by
  player avatars in Manage Teams.

**"Try a new game" (guest mode) never touches Supabase.** It's a
completely separate, self-contained flow (`src/screens/GuestGame.jsx`)
that keeps everything in React state only, nothing is written anywhere,
not even `localStorage`. Leaving that screen is the deletion.

## Folder structure

```
game-tracker/
├── supabase/
│   └── schema.sql          run this in Supabase's SQL Editor once
├── .env                     your real Supabase URL/key (gitignored)
├── .env.example             template for the above
├── public/
│   └── manifest.json        PWA config - icons are still a TODO
├── src/
│   ├── main.jsx
│   ├── App.jsx               routes + AuthProvider - the map of every screen
│   ├── styles/
│   │   └── tokens.css        colors, spacing, hero/pill styles
│   ├── lib/
│   │   ├── supabaseClient.js the Supabase client, reads .env
│   │   ├── AuthContext.jsx   session state, signUp/logIn/logOut
│   │   ├── dataStore.js      every Supabase CRUD call + row<->model mapping
│   │   └── statsHelpers.js   shared stat-tallying logic
│   ├── components/
│   │   ├── ProtectedRoute.jsx bounces to /login if not signed in
│   │   ├── NumberPad.jsx
│   │   ├── ConfirmDialog.jsx
│   │   └── PlayByPlay.jsx      play list, readOnly mode for finished games
│   ├── screens/
│   │   ├── Welcome.jsx        Sign up / Log in / Try a new game
│   │   ├── SignUp.jsx
│   │   ├── LogIn.jsx
│   │   ├── Home.jsx           post-login dashboard
│   │   ├── ManageTeams.jsx    team + roster CRUD, pending-game review
│   │   ├── NewGame.jsx
│   │   ├── LiveHub.jsx        the core scoring screen
│   │   ├── Summary.jsx        stat sheet + full play registry
│   │   ├── Stats.jsx          confirmed-game stat tallies
│   │   └── GuestGame.jsx      entirely self-contained, no backend at all
│   └── assets/
│       └── README.md
```

## What's deliberately simplified for this MVP

- **Stats are grouped by jersey number, not by a linked Person yet.**
  `plays.primary_slot_id`/`secondary_slot_id` exist in the schema for
  this, but nothing fills them in yet. Once you build "link a roster
  number to a person" in `ManageTeams`, update `Stats.jsx` to group by
  that instead, so a player's stats follow them across every team.
- **No resume-after-exit.** Exiting `LiveHub` mid-game navigates away,
  and though everything up to that point is saved in Supabase, there's
  no way to reopen that specific game and keep adding plays yet.
- **Single-confirmer game review**, any captain who opens a pending
  game under `ManageTeams` can confirm it, no dual sign-off.
- **Season/week filtering** isn't built into `Stats.jsx` yet, `games`
  already has `created_at`, so this is a date-range filter to add, not
  a schema change.
- **Guest games are genuinely one-shot.** There's no roster, no saved
  teams, no pending review, just the two default sides and a stat sheet
  at the end.

## Next steps, roughly in order

1. Confirm your Supabase project has Email sign-up enabled
   (Authentication -> Sign In / Providers)
2. Wire up roster-number-to-person linking, backfill `primary_slot_id`
3. Add a "reject / re-tag the other team" path to the pending review flow
4. Build the resume-a-game list
5. Add real PWA icons and test Add to Home Screen on iOS + Android
6. Layer in date-range filters on the Stats screen
