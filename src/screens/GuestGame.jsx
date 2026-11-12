import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { tallyGame } from '../lib/statsHelpers.js';
import NumberPad from '../components/NumberPad.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PlayByPlay from '../components/PlayByPlay.jsx';
import TeamPanel from '../components/TeamPanel.jsx';
import TdChooser from '../components/TdChooser.jsx';
import GameHeader, { BackButton } from '../components/GameHeader.jsx';
import ScoreBox from '../components/ScoreBox.jsx';
import GameStats from '../components/GameStats.jsx';

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
      <div className="screen-light">
        <GameHeader />
        <div className="guest-banner">Guest game. Nothing here is saved.</div>
        <main className="page">
          <h1 className="page-title">Final Score</h1>
          <ScoreBox nameA="Team 1" nameB="Team 2" scoreA={scoreA} scoreB={scoreB}>
            <span>Sign up if you want your games and stats to stick around.</span>
          </ScoreBox>

          <h2 className="section-title">Stat Sheet</h2>
          <GameStats nameA="Team 1" nameB="Team 2" rowsA={tallyA} rowsB={tallyB} />

          <h2 className="section-title">Play by Play</h2>
          <PlayByPlay plays={plays} readOnly />

          <button type="button" className="btn btn-primary" onClick={finishAndLeave}>Done</button>
        </main>
      </div>
    );
  }

  const numberPadTitle =
    numberPadFor?.stage === 'thrower' ? 'Who Threw the TD?' : numberPadFor?.stage === 'catcher' ? 'Who Caught It?' : 'Who Made the Play?';

  const panelHandlers = (side) => ({
    onTd: () => setTdChoiceSide(side),
    onPat1: () => openNumberPad(side, 'PAT1'),
    onPat2: () => openNumberPad(side, 'PAT2'),
    onSafety: () => openNumberPad(side, 'SAFETY'),
    onInt: () => openNumberPad(side, 'INTERCEPTION'),
    onSack: () => openNumberPad(side, 'SACK'),
  });

  return (
    <div className="screen-light">
      <GameHeader left={<BackButton label="Exit game" onClick={() => setShowExitConfirm(true)} />} />
      <div className="guest-banner">Guest game. Nothing here is saved.</div>
      <main className="tracker-page">
        <TeamPanel side="A" name="Team 1" label="Local" {...panelHandlers('A')} />
        <ScoreBox compact nameA="Team 1" nameB="Team 2" scoreA={scoreA} scoreB={scoreB} />
        <TeamPanel side="B" name="Team 2" label="Visitor" {...panelHandlers('B')} />

        <button type="button" className="btn btn-danger-solid" style={{ marginTop: 8 }} onClick={() => setShowEndConfirm(true)}>
          End Game
        </button>

        <h2 className="section-title">Play by Play</h2>
        <PlayByPlay plays={plays} onUndo={handleUndo} />
      </main>

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
          title="End the Game?"
          message="You'll see the stat sheet next, then it's gone for good. This is a guest game."
          cancelLabel="Keep Playing"
          confirmLabel="End Game"
          onConfirm={endGame}
          onCancel={() => setShowEndConfirm(false)}
        />
      )}

      {showExitConfirm && (
        <ConfirmDialog
          title="Exit the Game?"
          message="Nothing from a guest game is saved, so leaving now loses it for good."
          cancelLabel="Stay"
          confirmLabel="Exit"
          onConfirm={exitGame}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  );
}
