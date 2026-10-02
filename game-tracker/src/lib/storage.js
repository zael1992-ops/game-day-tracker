// Every write here IS the autosave. There's no separate "save game" step,
// components call these setters as soon as something happens and the
// browser's localStorage takes it from there. If the app closes or crashes
// mid-game, whatever was last written is what's there when it reopens.

const KEYS = {
  people: 'gt_people',
  teams: 'gt_teams',
  rosterSlots: 'gt_roster_slots',
  games: 'gt_games',
  plays: 'gt_plays',
};

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export const storage = {
  getPeople: () => load(KEYS.people),
  savePeople: (v) => save(KEYS.people, v),

  getTeams: () => load(KEYS.teams),
  saveTeams: (v) => save(KEYS.teams, v),

  getRosterSlots: () => load(KEYS.rosterSlots),
  saveRosterSlots: (v) => save(KEYS.rosterSlots, v),

  getGames: () => load(KEYS.games),
  saveGames: (v) => save(KEYS.games, v),

  getPlays: () => load(KEYS.plays),
  savePlays: (v) => save(KEYS.plays, v),
};
