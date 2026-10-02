// Core per-play categorization, shared by both the per-game stat sheet
// and the team-wide totals. Call it with whichever set of plays is
// already correctly scoped (one game's plays for a game view, or a
// team's own plays across many games for a team view) - this function
// just tallies whatever it's given, it doesn't do any scoping itself.
function detailedTally(plays) {
  const totals = {};
  function row(number) {
    if (!totals[number]) {
      totals[number] = { number, td: 0, passTD: 0, ints: 0, sacks: 0, safeties: 0, conversions: 0, points: 0 };
    }
    return totals[number];
  }

  for (const p of plays) {
    if (p.type === 'TD') {
      const r = row(p.primaryNumber);
      r.td += 1;
      r.points += p.points;
      // The thrower gets their own credit too, separate from the
      // receiver/scorer's TD count.
      if (p.subType === 'pass' && p.secondaryNumber) row(p.secondaryNumber).passTD += 1;
    } else if (p.type === 'INTERCEPTION') {
      row(p.primaryNumber).ints += 1;
    } else if (p.type === 'SACK') {
      row(p.primaryNumber).sacks += 1;
    } else if (p.type === 'SAFETY') {
      const r = row(p.primaryNumber);
      r.safeties += 1;
      r.points += p.points;
    } else if (p.type === 'PAT') {
      const r = row(p.primaryNumber);
      r.conversions += 1;
      r.points += p.points;
    }
  }

  return totals;
}

// For a single game (or any already-correctly-scoped set of plays):
// returns an array of stat rows, one per jersey number that did
// anything.
export function tallyGame(plays) {
  return Object.values(detailedTally(plays));
}

// Combines stats across every game a single TEAM played (not across
// different teams), which is safe to merge by jersey number: within
// one team's own roster, a number consistently belongs to one person.
// That's different from mixing teams, where the same number could
// belong to two unrelated people on two different teams.
export function buildTeamTotals(games, plays, teamId) {
  const sideByGame = {};
  for (const g of games) {
    if (g.teamAId === teamId) sideByGame[g.id] = 'A';
    else if (g.teamBId === teamId) sideByGame[g.id] = 'B';
  }
  const relevant = plays.filter((p) => sideByGame[p.gameId] === p.side);
  return detailedTally(relevant);
}

// Builds a detail line that only mentions categories that actually
// happened - "8 pts, 1 TD, 1 pass TD" rather than padding it out with
// every zero category.
export function describeTeamRow(row) {
  const parts = [];
  if (row.points) parts.push(`${row.points} pts`);
  if (row.td) parts.push(`${row.td} TD${row.td === 1 ? '' : 's'}`);
  if (row.passTD) parts.push(`${row.passTD} pass TD${row.passTD === 1 ? '' : 's'}`);
  if (row.ints) parts.push(`${row.ints} INT${row.ints === 1 ? '' : 's'}`);
  if (row.sacks) parts.push(`${row.sacks} sack${row.sacks === 1 ? '' : 's'}`);
  if (row.safeties) parts.push(`${row.safeties} safet${row.safeties === 1 ? 'y' : 'ies'}`);
  if (row.conversions) parts.push(`${row.conversions} conversion${row.conversions === 1 ? '' : 's'}`);
  return parts.length > 0 ? parts.join(', ') : 'No stats yet';
}
