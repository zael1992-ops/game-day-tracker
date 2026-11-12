import { useState } from 'react';

// Player stats table, used on Statistics (a team's totals across all its
// games) and on a single game's stats (Game summary, Watch page, guest
// game). Short headers so all seven columns fit on a phone next to the
// player; the legend underneath spells them out. Tap a header to sort.
export const STAT_COLUMNS = [
  { key: 'points', label: 'PTS', full: 'Points' },
  { key: 'td', label: 'TD', full: 'Touchdowns' },
  { key: 'passTD', label: 'PTD', full: 'Pass TDs thrown' },
  { key: 'ints', label: 'INT', full: 'Interceptions' },
  { key: 'sacks', label: 'SCK', full: 'Sacks' },
  { key: 'safeties', label: 'SAF', full: 'Safeties' },
  { key: 'conversions', label: 'CNV', full: 'Conversions' },
];

// "Emiliano Santiago Hernandez" -> "Emiliano H." so the name column stays
// narrow. The full name is still there for screen readers.
export function shortName(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// rows: [{ number, name?, points, td, passTD, ints, sacks, safeties, conversions }]
export default function StatTable({ rows, emptyText = 'No stats logged.' }) {
  const [sortKey, setSortKey] = useState('points');
  const [sortDir, setSortDir] = useState('desc');

  function sortBy(key) {
    if (key === sortKey) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  if (!rows || rows.length === 0) return <p className="empty-state">{emptyText}</p>;

  const sorted = [...rows].sort((a, b) => {
    const diff = (sortDir === 'desc' ? 1 : -1) * ((b[sortKey] || 0) - (a[sortKey] || 0));
    // Ties keep jersey-number order so the table doesn't jump around.
    return diff || Number(a.number) - Number(b.number);
  });

  return (
    <>
      <div className="stat-table-wrap">
        <table className="stat-table">
          <thead>
            <tr>
              <th className="col-player">Player</th>
              {STAT_COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={sortKey === col.key ? 'is-sorted' : undefined}
                  aria-sort={sortKey === col.key ? (sortDir === 'desc' ? 'descending' : 'ascending') : undefined}
                >
                  <button type="button" onClick={() => sortBy(col.key)} aria-label={`Sort by ${col.full}`}>
                    {col.label}{sortKey === col.key ? (sortDir === 'desc' ? ' \u2193' : ' \u2191') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.number}>
                <td className="col-player">
                  <span className="player-num">#{r.number}</span>
                  {r.name && <span className="player-name" title={r.name} aria-label={r.name}>{shortName(r.name)}</span>}
                </td>
                {STAT_COLUMNS.map((col) => (
                  <td key={col.key} style={col.key === 'points' ? { fontWeight: 700 } : undefined}>{r[col.key] || 0}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="stat-legend">
        {STAT_COLUMNS.map((c) => `${c.label} ${c.full}`).join(' · ')}. Tap a column to sort.
      </p>
    </>
  );
}
