export default function PlayByPlay({ plays, onUndo, readOnly = false }) {
  const visible = plays.filter((p) => !p.isUndone).sort((a, b) => b.sequence - a.sequence);

  if (visible.length === 0) {
    return <p style={{ color: 'var(--color-text-muted)' }}>No plays logged yet.</p>;
  }

  return (
    <div className="stack" style={{ padding: 0 }}>
      {visible.map((p) => (
        <div key={p.id} style={rowStyle}>
          <span>{describePlay(p)}</span>
          {!readOnly && (
            <button onClick={() => onUndo(p.id)} aria-label="Remove this play" style={{ padding: '4px 10px' }}>
              &times;
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function describePlay(p) {
  switch (p.type) {
    case 'TD':
      if (p.subType === 'pass') return `Pass TD: #${p.secondaryNumber} to #${p.primaryNumber} (6 pts)`;
      if (p.subType === 'int_return') return `Pick-6: #${p.primaryNumber} (6 pts)`;
      return `Run TD: #${p.primaryNumber} (6 pts)`;
    case 'PAT':
      return `Conversion: #${p.primaryNumber} (${p.points} pt${p.points === 1 ? '' : 's'})`;
    case 'SAFETY':
      return `Safety: #${p.primaryNumber} (2 pts)`;
    case 'INTERCEPTION':
      return `Interception: #${p.primaryNumber}`;
    case 'SACK':
      return `Sack: #${p.primaryNumber}`;
    default:
      return p.type;
  }
}

const rowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  padding: '8px 12px',
};
