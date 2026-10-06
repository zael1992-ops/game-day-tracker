import { describeTeamRow } from '../lib/statsHelpers.js';

// Post-game stat sheet: home (Local) team on the left, away (Visitor)
// on the right, so both fit on screen without scrolling.
export default function StatSheet({ nameA, nameB, rowsA, rowsB, namesA = {}, namesB = {} }) {
  return (
    <div className="stat-columns">
      <Column name={nameA} label="Local" rows={rowsA} names={namesA} accent="var(--color-team-a)" />
      <Column name={nameB} label="Visitor" rows={rowsB} names={namesB} accent="var(--color-team-b)" />
    </div>
  );
}

function Column({ name, label, rows, names, accent }) {
  return (
    <div className="stat-column">
      <div className="stat-column-head">
        <span className="stat-column-swatch" style={{ background: accent }} />
        <div style={{ minWidth: 0 }}>
          <strong className="stat-column-name">{name}</strong>
          <span className="stat-column-label">{label}</span>
        </div>
      </div>
      {rows.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: 13, margin: 0 }}>No stats logged.</p>}
      {rows.map((r) => (
        <div key={r.number} className="stat-row" style={{ '--stat-accent': accent }}>
          <span className="stat-row-name">#{r.number}{names[r.number] ? ` ${names[r.number]}` : ''}</span>
          <span className="stat-row-detail">{describeTeamRow(r)}</span>
        </div>
      ))}
    </div>
  );
}
