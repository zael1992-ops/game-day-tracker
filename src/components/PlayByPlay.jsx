// Play by play cards, newest first. Each card: team color square, what
// happened and who did it, and on the right either the points scored or,
// for interceptions and sacks, that player's running count this game
// (their 1st, 2nd, 3rd...).
//
// namesA / namesB map jersey number -> player name for registered teams.
// Leave them empty for Team 1 / Team 2 games, guest games, and the public
// watch page, and cards show numbers only.
const SIDE_COLOR = { A: 'var(--color-team-a)', B: 'var(--color-team-b)' };
const COUNTED_TYPES = { INTERCEPTION: 'INT', SACK: 'SACK' };

export default function PlayByPlay({ plays, onUndo, readOnly = false, namesA = {}, namesB = {} }) {
  const live = plays.filter((p) => !p.isUndone).sort((a, b) => a.sequence - b.sequence);

  if (live.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>No plays logged yet.</p>;
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
    <div className="play-list">
      {newestFirst.map((p) => {
        const names = p.side === 'A' ? namesA : namesB;
        const { title, lines } = describe(p, names);
        const color = SIDE_COLOR[p.side];
        return (
          <div key={p.id} className="play-card" style={{ borderColor: color }}>
            <span className="play-card-swatch" style={{ background: color }} />
            <div className="play-card-text">
              <span className="play-card-title">{title}</span>
              {lines.map((line) => (
                <span key={line} className="play-card-line">{line}</span>
              ))}
            </div>
            <div className="play-card-value">
              {COUNTED_TYPES[p.type] ? (
                <>
                  <span className="play-card-big">{runningCount[p.id]}</span>
                  <span className="play-card-unit">{COUNTED_TYPES[p.type]}</span>
                </>
              ) : (
                <span className="play-card-big">{p.points} {p.points === 1 ? 'pt' : 'pts'}</span>
              )}
            </div>
            {!readOnly && (
              <button type="button" className="play-card-remove" onClick={() => onUndo(p.id)} aria-label="Remove this play">
                &times;
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function who(number, names) {
  return names[number] ? `#${number} ${names[number]}` : `#${number}`;
}

function describe(p, names) {
  switch (p.type) {
    case 'TD':
      if (p.subType === 'pass') {
        return { title: 'Touchdown Pass', lines: [`by ${who(p.secondaryNumber, names)}`, `Reception by ${who(p.primaryNumber, names)}`] };
      }
      if (p.subType === 'int_return') return { title: 'Pick-6', lines: [`by ${who(p.primaryNumber, names)}`] };
      return { title: 'Touchdown', lines: [`by ${who(p.primaryNumber, names)}`] };
    case 'PAT':
      return { title: `${p.points} pt Conversion`, lines: [`by ${who(p.primaryNumber, names)}`] };
    case 'SAFETY':
      return { title: 'Safety', lines: [`by ${who(p.primaryNumber, names)}`] };
    case 'INTERCEPTION':
      return { title: 'Interception', lines: [`by ${who(p.primaryNumber, names)}`] };
    case 'SACK':
      return { title: 'Sack', lines: [`by ${who(p.primaryNumber, names)}`] };
    default:
      return { title: p.type, lines: [] };
  }
}
