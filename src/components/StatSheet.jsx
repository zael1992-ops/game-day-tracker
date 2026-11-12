import { describeTeamRow } from '../lib/statsHelpers.js';

// Post-game stat sheet: Local team on the left, Visitor on the right, so
// both fit on screen without scrolling. Each player card has a bar in the
// team's color.
export default function StatSheet({ nameA, nameB, rowsA, rowsB, namesA = {}, namesB = {} }) {
  return (
    <div className="stat-columns">
      <Column side="A" name={nameA} label="Local" rows={rowsA} names={namesA} />
      <Column side="B" name={nameB} label="Visitor" rows={rowsB} names={namesB} />
    </div>
  );
}

function Column({ side, name, label, rows, names }) {
  return (
    <div className={`stat-column side-${side.toLowerCase()}`}>
      <div className="stat-column-head">
        <strong className="stat-column-name">{name}</strong>
        <span className="stat-column-label">{label}</span>
      </div>
      {rows.length === 0 && <p className="muted small">No stats logged.</p>}
      {rows.map((r) => (
        <div key={r.number} className="stat-row">
          <span className="stat-row-name">#{r.number}{names[r.number] ? ` ${names[r.number]}` : ''}</span>
          <span className="stat-row-detail">{describeTeamRow(r)}</span>
        </div>
      ))}
    </div>
  );
}
