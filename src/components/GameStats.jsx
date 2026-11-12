import { useState } from 'react';
import StatSheet from './StatSheet.jsx';
import StatTable from './StatTable.jsx';

// Stats for one game, with two views:
//   Stat Sheet: both teams side by side as cards (the quick summary)
//   Stats Table: one team at a time in the same table as Statistics,
//                with a switch between the two teams
// Only players who did something in this game are listed.
export default function GameStats({ nameA, nameB, rowsA, rowsB, namesA = {}, namesB = {} }) {
  const [view, setView] = useState('sheet'); // 'sheet' | 'table'
  const [side, setSide] = useState('A');

  const withNames = (rows, names) => rows.map((r) => ({ ...r, name: names[r.number] || null }));

  return (
    <>
      <div className="tabs" role="tablist" aria-label="Stats view">
        <Tab active={view === 'sheet'} onClick={() => setView('sheet')}>Stat Sheet</Tab>
        <Tab active={view === 'table'} onClick={() => setView('table')}>Stats Table</Tab>
      </div>

      {view === 'sheet' ? (
        <StatSheet nameA={nameA} nameB={nameB} rowsA={rowsA} rowsB={rowsB} namesA={namesA} namesB={namesB} />
      ) : (
        <>
          <div className="team-switch" role="tablist" aria-label="Team">
            <button
              type="button"
              role="tab"
              aria-selected={side === 'A'}
              className={`team-switch-btn side-a${side === 'A' ? ' is-active' : ''}`}
              onClick={() => setSide('A')}
            >
              <span className="team-switch-name">{nameA}</span>
              <span className="team-switch-label">Local</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={side === 'B'}
              className={`team-switch-btn side-b${side === 'B' ? ' is-active' : ''}`}
              onClick={() => setSide('B')}
            >
              <span className="team-switch-name">{nameB}</span>
              <span className="team-switch-label">Visitor</span>
            </button>
          </div>
          <StatTable
            key={side}
            rows={side === 'A' ? withNames(rowsA, namesA) : withNames(rowsB, namesB)}
            emptyText={`No stats logged for ${side === 'A' ? nameA : nameB} in this game.`}
          />
        </>
      )}
    </>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button type="button" role="tab" aria-selected={active} className={`tab${active ? ' is-active' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
