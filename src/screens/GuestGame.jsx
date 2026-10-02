import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tallyGame, describeTeamRow } from '../lib/statsHelpers.js';
import NumberPad from '../components/NumberPad.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PlayByPlay from '../components/PlayByPlay.jsx';
import TrackerButton from '../components/TrackerButton.jsx';

// Entirely self-contained: no Supabase, no localStorage, not even
// sessionStorage. Everything lives in this component's state, and the
// moment you navigate away (or just close the tab) it's gone - exactly
// the "no info stored for them" guest mode that was asked for.
let guestPlayCounter = 0;

export default function GuestGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('live'); // 'live' | 'summary'
  const [plays, setPlays] = useState([]);
  const [lastInterception, setLastInterception] = useState(null);

  const [tdChoiceSide, setTdChoiceSide] = useState(null);
  const [numberPadFor, setNumberPadFor] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const scoreA = useMemo(() => sumSide(plays, 'A'), [plays]);
  const scoreB = useMemo(() => sumSide(plays, 'B'), [plays]);

  function sumSide(allPlays, side) {
    return allPlays.filter((p) => !p.isUndone && p.side === side).reduce((s, p) => s + p.points, 0);
  }

  function addPlay(partial) {
    guestPlayCounter += 1;
    const play = { id: `guest_${guestPlayCounter}`, gameId: 'guest', sequence: guestPlayCounter, isUndone: false, ...partial };
    setPlays((prev) => [...prev, play]);
    if (partial.type === 'INTERCEPTION') {
      setLastInterception({ side: partial.side, number: partial.primaryNumber });
    } else {
      setLastInterception(null);
    }
  }

  function handleUndo(playId) {
    setPlays((prev) => prev.map((p) => (p.id === playId ? { ...p, isUndone: true } : p)));
  }

  function chooseRunTd(side) {
    setTdChoiceSide(null);
    setNumberPadFor({ side, type: 'TD', subType: 'run', stage: 'scorer' });
  }

  function choosePassTd(side) {
    setTdChoiceSide(null);
    setNumberPadFor({ side, type: 'TD', subType: 'pass', stage: 'thrower' });
  }

  function choosePick6(side) {
    setTdChoiceSide(null);
    addPlay({ side, type: 'TD', subType: 'int_return', primaryNumber: lastInterception.number, points: 6 });
  }

  function openNumberPad(side, type) {
    setNumberPadFor({ side, type, stage: 'single' });
  }

  function handleNumberSubmit(number) {
    const f = numberPadFor;
    if (!f) return;

    if (f.type === 'TD' && f.subType === 'run') {
      addPlay({ side: f.side, type: 'TD', subType: 'run', primaryNumber: number, points: 6 });
      setNumberPadFor(null);
      return;
    }

    if (f.type === 'TD' && f.subType === 'pass') {
      if (f.stage === 'thrower') {
        setNumberPadFor({ ...f, stage: 'catcher', thrower: number });
        return;
      }
      addPlay({ side: f.side, type: 'TD', subType: 'pass', primaryNumber: number, secondaryNumber: f.thrower, points: 6 });
      setNumberPadFor(null);
      return;
    }

    const pointsByType = { PAT1: 1, PAT2: 2, SAFETY: 2, INTERCEPTION: 0, SACK: 0 };
    const typeByType = { PAT1: 'PAT', PAT2: 'PAT', SAFETY: 'SAFETY', INTERCEPTION: 'INTERCEPTION', SACK: 'SACK' };
    addPlay({ side: f.side, type: typeByType[f.type], primaryNumber: number, points: pointsByType[f.type] });
    setNumberPadFor(null);
  }

  function endGame() {
    setShowEndConfirm(false);
    setPhase('summary');
  }

  function exitGame() {
    setShowExitConfirm(false);
    navigate('/');
  }

  function finishAndLeave() {
    // Nothing to delete anywhere - it only ever existed in this
    // component's state, so navigating away is the deletion.
    navigate('/');
  }

  if (phase === 'summary') {
    const confirmedPlays = plays.filter((p) => !p.isUndone);
    const tallyA = tallyGame(confirmedPlays.filter((p) => p.side === 'A')).sort((a, b) => b.points - a.points);
    const tallyB = tallyGame(confirmedPlays.filter((p) => p.side === 'B')).sort((a, b) => b.points - a.points);

    return (
      <div className="stack">
        <h2>Final score</h2>
        <p style={{ fontSize: 20 }}>Team 1 {scoreA} - {scoreB} Team 2</p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          This was a guest game, nothing here is saved. Sign up if you want your games and stats to stick around.
        </p>

        <h3 style={{ marginBottom: 0 }}>Stat sheet</h3>
        <TeamStatSheet name="Team 1" rows={tallyA} accent="var(--color-team-a)" />
        <TeamStatSheet name="Team 2" rows={tallyB} accent="var(--color-team-b)" />

        <button className="pill-button mint" onClick={finishAndLeave}>
          Done
        </button>
      </div>
    );
  }

  const numberPadTitle =
    numberPadFor?.stage === 'thrower' ? 'Who threw the TD?' : numberPadFor?.stage === 'catcher' ? 'Who caught it?' : 'Enter player #';

  return (
    <div className="stack">
      <button onClick={() => setShowExitConfirm(true)} style={{ alignSelf: 'flex-start' }}>Exit</button>

      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <TeamLabel name="Team 1" color="var(--color-team-a)" />
          <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, minWidth: 100, textAlign: 'center' }}>{scoreA} - {scoreB}</span>
          <TeamLabel name="Team 2" color="var(--color-team-b)" />
        </div>
      </div>

      <TeamPanel
        name="Team 1"
        color="var(--color-team-a)"
        onTd={() => setTdChoiceSide('A')}
        onPat1={() => openNumberPad('A', 'PAT1')}
        onPat2={() => openNumberPad('A', 'PAT2')}
        onSafety={() => openNumberPad('A', 'SAFETY')}
        onInt={() => openNumberPad('A', 'INTERCEPTION')}
        onSack={() => openNumberPad('A', 'SACK')}
      />

      <TeamPanel
        name="Team 2"
        color="var(--color-team-b)"
        onTd={() => setTdChoiceSide('B')}
        onPat1={() => openNumberPad('B', 'PAT1')}
        onPat2={() => openNumberPad('B', 'PAT2')}
        onSafety={() => openNumberPad('B', 'SAFETY')}
        onInt={() => openNumberPad('B', 'INTERCEPTION')}
        onSack={() => openNumberPad('B', 'SACK')}
      />

      <button onClick={() => setShowEndConfirm(true)} style={{ background: 'var(--color-danger)', color: '#fff', borderColor: 'var(--color-danger)' }}>
        End game
      </button>

      <h3 style={{ marginBottom: 0 }}>Play by play</h3>
      <PlayByPlay plays={plays} onUndo={handleUndo} />

      {tdChoiceSide && (
        <TdChooser
          pick6Number={lastInterception?.side === tdChoiceSide ? lastInterception.number : null}
          onRun={() => chooseRunTd(tdChoiceSide)}
          onPass={() => choosePassTd(tdChoiceSide)}
          onPick6={() => choosePick6(tdChoiceSide)}
          onCancel={() => setTdChoiceSide(null)}
        />
      )}

      {numberPadFor && (
        <NumberPad
          key={`${numberPadFor.side}-${numberPadFor.type}-${numberPadFor.stage}`}
          title={numberPadTitle}
          onSubmit={handleNumberSubmit}
          onCancel={() => setNumberPadFor(null)}
        />
      )}

      {showEndConfirm && (
        <ConfirmDialog
          message="End the game? You'll see the stat sheet next, then it's gone for good, this is a guest game."
          onConfirm={endGame}
          onCancel={() => setShowEndConfirm(false)}
        />
      )}

      {showExitConfirm && (
        <ConfirmDialog
          message="Exit this guest game? Nothing from it is saved anywhere, so leaving now loses it for good."
          onConfirm={exitGame}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  );
}

function TeamStatSheet({ name, rows, accent }) {
  return (
    <div className="stack" style={{ padding: 0 }}>
      <strong>{name}</strong>
      {rows.length === 0 && <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>No stats logged.</p>}
      {rows.map((r) => (
        <div key={r.number} className="stat-row" style={{ '--stat-accent': accent }}>
          <span className="stat-row-name">#{r.number}</span>
          <span className="stat-row-detail">{describeTeamRow(r)}</span>
        </div>
      ))}
    </div>
  );
}

function TeamLabel({ name, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 100 }}>
      <span style={{ width: 20, height: 20, borderRadius: 4, background: color, display: 'inline-block' }} />
      <strong
        style={{
          fontSize: 13,
          textAlign: 'center',
          lineHeight: 1.2,
          width: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {name}
      </strong>
    </div>
  );
}

function TeamPanel({ name, color, onTd, onPat1, onPat2, onSafety, onInt, onSack }) {
  return (
    <div className="stack" style={{ padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 20, height: 20, borderRadius: 4, background: color, display: 'inline-block' }} />
        <strong>{name}</strong>
      </div>
      <TrackerButton accent={color} onClick={onTd}>Touchdown</TrackerButton>
      <div style={{ display: 'flex', gap: 16 }}>
        <TrackerButton accent={color} onClick={onPat1}>1 pts</TrackerButton>
        <TrackerButton accent={color} onClick={onPat2}>2 pts</TrackerButton>
        <TrackerButton accent={color} onClick={onSafety}>Safety</TrackerButton>
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <TrackerButton accent={color} onClick={onInt}>Interception</TrackerButton>
        <TrackerButton accent={color} onClick={onSack}>Sack</TrackerButton>
      </div>
    </div>
  );
}

function TdChooser({ pick6Number, onRun, onPass, onPick6, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 10 }}>
      <div className="stack" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius)', maxWidth: 320, width: '100%' }}>
        <h3 style={{ margin: 0 }}>Touchdown type</h3>
        <button onClick={onRun}>Run TD</button>
        <button onClick={onPass}>Pass TD</button>
        {pick6Number && <button onClick={onPick6}>Pick-6 (returned by #{pick6Number})</button>}
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
