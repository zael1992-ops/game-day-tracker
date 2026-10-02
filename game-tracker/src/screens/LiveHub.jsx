import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storage } from '../lib/storage.js';
import { createPlay } from '../lib/models.js';
import NumberPad from '../components/NumberPad.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PlayByPlay from '../components/PlayByPlay.jsx';

export default function LiveHub() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [teamA, setTeamA] = useState(null); // saved Team record, or null if unsaved
  const [teamB, setTeamB] = useState(null);
  const [plays, setPlays] = useState([]);
  // { side, number } - set right after logging an interception, cleared
  // by any other play. Drives the conditional Pick-6 button.
  const [lastInterception, setLastInterception] = useState(null);

  const [tdChoiceSide, setTdChoiceSide] = useState(null);
  const [numberPadFor, setNumberPadFor] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    const found = storage.getGames().find((g) => g.id === gameId);
    setGame(found || null);
    setPlays(storage.getPlays().filter((p) => p.gameId === gameId));
    if (found) {
      const teams = storage.getTeams();
      setTeamA(teams.find((t) => t.id === found.teamAId) || null);
      setTeamB(teams.find((t) => t.id === found.teamBId) || null);
    }
  }, [gameId]);

  const nameA = teamA?.name || game?.teamAName || 'Team 1';
  const nameB = teamB?.name || game?.teamBName || 'Team 2';

  const scoreA = useMemo(() => sumSide(plays, 'A'), [plays]);
  const scoreB = useMemo(() => sumSide(plays, 'B'), [plays]);

  function sumSide(allPlays, side) {
    return allPlays.filter((p) => !p.isUndone && p.side === side).reduce((s, p) => s + p.points, 0);
  }

  function persistPlays(updated) {
    setPlays(updated);
    const others = storage.getPlays().filter((p) => p.gameId !== gameId);
    storage.savePlays([...others, ...updated]);
  }

  function addPlay(partial) {
    const play = createPlay({ gameId, ...partial });
    const updated = [...plays, play];
    persistPlays(updated);
    if (partial.type === 'INTERCEPTION') {
      setLastInterception({ side: partial.side, number: partial.primaryNumber });
    } else {
      setLastInterception(null);
    }
  }

  function undoPlay(playId) {
    persistPlays(plays.map((p) => (p.id === playId ? { ...p, isUndone: true } : p)));
  }

  // --- Touchdown sub-flow ---
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
    const games = storage.getGames();
    const updated = games.map((g) => (g.id === gameId ? { ...g, status: 'pending_confirmation', scoreA, scoreB } : g));
    storage.saveGames(updated);
    setShowEndConfirm(false);
    navigate(`/game/${gameId}/summary`);
  }

  function exitGame() {
    setShowExitConfirm(false);
    navigate('/');
  }

  if (!game) return <div className="stack">Game not found.</div>;

  const numberPadTitle =
    numberPadFor?.stage === 'thrower' ? 'Who threw the TD?' : numberPadFor?.stage === 'catcher' ? 'Who caught it?' : 'Enter player #';

  return (
    <div className="stack">
      <button onClick={() => setShowExitConfirm(true)} style={{ alignSelf: 'flex-start' }}>Exit</button>

      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <TeamLabel name={nameA} color="var(--color-team-a)" logo={teamA?.logo} />
          <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1 }}>{scoreA} - {scoreB}</span>
          <TeamLabel name={nameB} color="var(--color-team-b)" logo={teamB?.logo} />
        </div>
      </div>

      <TeamPanel
        name={nameA}
        color="var(--color-team-a)"
        onTd={() => setTdChoiceSide('A')}
        onPat1={() => openNumberPad('A', 'PAT1')}
        onPat2={() => openNumberPad('A', 'PAT2')}
        onSafety={() => openNumberPad('A', 'SAFETY')}
        onInt={() => openNumberPad('A', 'INTERCEPTION')}
        onSack={() => openNumberPad('A', 'SACK')}
      />

      <TeamPanel
        name={nameB}
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
      <PlayByPlay plays={plays} onUndo={undoPlay} />

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
          message="End the game? Final stats go to a team captain for review before they count."
          onConfirm={endGame}
          onCancel={() => setShowEndConfirm(false)}
        />
      )}

      {showExitConfirm && (
        <ConfirmDialog
          message="Exit this game? Everything so far is autosaved, but the MVP doesn't yet support resuming a game after you leave this screen."
          onConfirm={exitGame}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  );
}

function TeamLabel({ name, color, logo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      {logo ? (
        <img src={logo} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
      ) : (
        <span style={{ width: 20, height: 20, borderRadius: 4, background: color, display: 'inline-block' }} />
      )}
      <strong style={{ fontSize: 14 }}>{name}</strong>
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
      <button onClick={onTd}>Touchdown</button>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onPat1} style={{ flex: 1 }}>1 pts</button>
        <button onClick={onPat2} style={{ flex: 1 }}>2 pts</button>
        <button onClick={onSafety} style={{ flex: 1 }}>Safety</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onInt} style={{ flex: 1 }}>Interception</button>
        <button onClick={onSack} style={{ flex: 1 }}>Sack</button>
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
