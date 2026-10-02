// This file is the schema. Every entity we talked through has a factory
// function here so the shape is defined in exactly one place.

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// A real human. One global id, so their stats can span multiple teams.
export function createPerson(name) {
  return { id: makeId('person'), name };
}

// A saved team.
export function createTeam(name, color = '#3fb950') {
  return { id: makeId('team'), name, color, logo: null };
}

// Links a Person to a Team with a jersey number. Can exist with no
// personId yet (a game-scoped placeholder for an unrostered number) -
// filling in a roster later just sets personId on the matching slot.
export function createRosterSlot({ teamId, number, personId = null, isCaptain = false }) {
  return { id: makeId('slot'), teamId, number, personId, isCaptain };
}

// teamAId/teamBId are null for a default "Team 1"/"Team 2" that was never
// saved - teamAName/teamBName carry the display name in that case.
// status: 'active' -> 'pending_confirmation' -> 'confirmed' (or a captain
// could reject/correct it while it's pending, see ManageTeams).
export function createGame({ teamAId = null, teamBId = null }) {
  return {
    id: makeId('game'),
    teamAId,
    teamBId,
    teamAName: null,
    teamBName: null,
    scoreA: 0,
    scoreB: 0,
    status: 'active',
    createdAt: Date.now(),
  };
}

// side: 'A' | 'B', matches Game.teamAId/teamBId regardless of whether
// that team was ever saved.
// type: 'TD' | 'PAT' | 'SAFETY' | 'INTERCEPTION' | 'SACK'
// subType (TD only): 'run' | 'pass' | 'int_return'
// primaryNumber is always set (the jersey number that matters most for
// this play: scorer, returner, tackler, interceptor...). secondaryNumber
// is only used for a pass TD (the thrower).
// primarySlotId/secondarySlotId start null - once roster numbers are
// linked to real People, backfill these so stats can group by person
// instead of by raw number.
export function createPlay({
  gameId,
  side,
  type,
  subType = null,
  primaryNumber,
  secondaryNumber = null,
  points = 0,
}) {
  return {
    id: makeId('play'),
    gameId,
    side,
    type,
    subType,
    primaryNumber,
    secondaryNumber,
    primarySlotId: null,
    secondarySlotId: null,
    points,
    sequence: Date.now(),
    isUndone: false,
  };
}
