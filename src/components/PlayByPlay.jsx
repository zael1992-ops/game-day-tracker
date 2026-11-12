// Play by play, newest first. Draft based on the GDay card style:
//
//   | Lobos                          +6 |
//   | Touchdown Pass                    |
//   | #7 Jaime to #21 Jordi       Undo  |
//
// The bar on the left and the team name are in that team's color. The
// right side shows the points scored, or for interceptions and sacks
// that player's running count this game (1st INT, 2nd INT...).
//
// namesA / namesB map jersey number -> player name for registered teams.
// Leave them empty for Team 1 / Team 2 games, guest games and the public
// watch page, and plays show numbers only.
const COUNTED_TYPES = { INTERCEPTION: 'INT', SACK: 'SACK' };

export default function PlayByPlay({ plays, onUndo, readOnly = false, namesA = {}, namesB = {}, teamAName = 'Team 1', teamBName = 'Team 2' }) {
  const live = plays.filter((p) => !p.isUndone).sort((a, b) => a.sequence - b.sequence);

  if (live.length === 0) {
    return <p className="play-empty">No plays logged yet. Plays show up here as you tap the buttons above.</p>;
  }

  // Running count per player per stat, computed oldest to newest so
  // undoing a play renumbers everything after it automatically.
  const runningCount = {};
  const seen = {};
  for (const p of live) {
    if (!COUNTED_TYPES[p.type]) continue;
    const key = `${p.side}|${p.type}|${p.primaryNumber}`;
    seen[key] = (seen[key] || 0) + 1;
    runningCount[p.id] = seen[key];
  }

  const newestFirst = [...live].reverse();

  return (
    <ol className="play-list">
      {newestFirst.map((p) => {
        const names = p.side === 'A' ? namesA : namesB;
        const { title, line } = describe(p, names);
        const counted = COUNTED_TYPES[p.type];
        return (
          <li key={p.id} className={`play-card side-${p.side.toLowerCase()}`}>
            <div className="play-card-text">
              <span className="play-card-team">{p.side === 'A' ? teamAName : teamBName}</span>
              <span className="play-card-title">{title}</span>
              <span className="play-card-line">{line}</span>
            </div>
            <div className="play-card-value">
              {counted ? (
                <>
                  <span className="play-card-big">{ordinal(runningCount[p.id])}</span>
                  <span className="play-card-unit">{counted}</span>
                </>
              ) : (
                <>
                  <span className="play-card-big">+{p.points}</span>
                  <span className="play-card-unit">{p.points === 1 ? 'PT' : 'PTS'}</span>
                </>
              )}
              {!readOnly && (
                <button type="button" className="play-card-undo" onClick={() => onUndo(p.id)} aria-label={`Undo ${title}`}>
                  Undo
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function who(number, names) {
  return names[number] ? `#${number} ${names[number]}` : `#${number}`;
}

function describe(p, names) {
  switch (p.type) {
    case 'TD':
      if (p.subType === 'pass') return { title: 'Touchdown Pass', line: `${who(p.secondaryNumber, names)} to ${who(p.primaryNumber, names)}` };
      if (p.subType === 'int_return') return { title: 'Pick-6', line: `by ${who(p.primaryNumber, names)}` };
      return { title: 'Touchdown', line: `by ${who(p.primaryNumber, names)}` };
    case 'PAT':
      return { title: `${p.points} pt Conversion`, line: `by ${who(p.primaryNumber, names)}` };
    case 'SAFETY':
      return { title: 'Safety', line: `by ${who(p.primaryNumber, names)}` };
    case 'INTERCEPTION':
      return { title: 'Interception', line: `by ${who(p.primaryNumber, names)}` };
    case 'SACK':
      return { title: 'Sack', line: `by ${who(p.primaryNumber, names)}` };
    default:
      return { title: p.type, line: '' };
  }
}
