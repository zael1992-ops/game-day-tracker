import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../lib/storage.js';

export default function Stats() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const confirmedIds = new Set(storage.getGames().filter((g) => g.status === 'confirmed').map((g) => g.id));
    const plays = storage.getPlays().filter((p) => !p.isUndone && confirmedIds.has(p.gameId));

    // MVP: tallied by raw jersey number within a game. Once roster
    // numbers are linked to a Person (primarySlotId gets filled in),
    // switch this to group by personId for real lifetime/per-team stats
    // that follow a player across saved teams.
    const tally = {};
    for (const p of plays) {
      const key = `${p.gameId}:${p.side}:${p.primaryNumber}`;
      if (!tally[key]) tally[key] = { number: p.primaryNumber, td: 0, points: 0, ints: 0, sacks: 0 };
      if (p.type === 'TD') tally[key].td += 1;
      if (p.type === 'INTERCEPTION') tally[key].ints += 1;
      if (p.type === 'SACK') tally[key].sacks += 1;
      tally[key].points += p.points;
    }
    setRows(Object.values(tally).sort((a, b) => b.points - a.points));
  }, []);

  return (
    <div className="stack">
      <Link to="/">&larr; Home</Link>
      <h2>Statistics</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
        Confirmed games only. Grouped by number for now, real per-player lifetime stats come once roster linking is wired up.
      </p>
      {rows.map((r, i) => (
        <div key={i} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', padding: '8px 12px' }}>
          #{r.number}: {r.points} pts, {r.td} TD, {r.ints} INT, {r.sacks} sacks
        </div>
      ))}
      {rows.length === 0 && <p>No confirmed games yet.</p>}
    </div>
  );
}
