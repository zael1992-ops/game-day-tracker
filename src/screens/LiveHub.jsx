import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGame, listTeams, listPlays, insertPlay, undoPlay as undoPlayRemote, updateGameStatus } from '../lib/dataStore.js';
import NumberPad from '../components/NumberPad.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PlayByPlay from '../components/PlayByPlay.jsx';
import TrackerButton from '../components/TrackerButton.jsx';

export default function LiveHub() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [plays, setPlays] = useState([]);
  const [loading, setLoading] = useState(true);
  // { side, number } - set right after logging an interception, cleared
  // by any other play. Drives the conditional Pick-6 button.
  const [lastInterception, setLastInterception] = useState(null);

  const [tdChoiceSide, setTdChoiceSide] = useState(null);
  const [numberPadFor, setNumberPadFor] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      const [foundGame, foundPlays, teams] = await Promise.all([getGame(gameId), listPlays(gameId), listTeams()]);
      setGame(foundGame);
      setPlays(foundPlays);
      setTeamA(teams.find((t) => t.id === foundGame.teamAId) || null);
      setTeamB(teams.find((t) => t.id === foundGame.teamBId) || null);
      setLoading(false);
    })();
  }, [gameId]);

  const nameA = teamA?.name || game?.teamAName || 'Team 1';
  const nameB = teamB?.name || game?.teamBName || 'Team 2';

  const scoreA = useMemo(() => sumSide(plays, 'A'), [plays]);
  const scoreB = useMemo(() => sumSide(plays, 'B'), [plays]);

  function sumSide(allPlays, side) {
    return allPlays.filter((p) => !p.isUndone && p.side === side).reduce((s, p) => s + p.points, 0);
  }

  async function addPlay(partial) {
    const play = await insertPlay({ gameId, ...partial });
    setPlays((prev) => [...prev, play]);
    if (partial.type === 'INTERCEPTION') {
      setLastInterception({ side: partial.side, number: partial.primaryNumber });
    } else {
      setLastInterception(null);
    }
  }

  async function handleUndo(playId) {
    await undoPlayRemote(playId);
    setPlays((prev) => prev.map((p) => (p.id === playId ? { ...p, isUndone: true } : p)));
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

  async function endGame() {
    await updateGameStatus(gameId, 'pending_confirmation', scoreA, scoreB);
    setShowEndConfirm(false);
    navigate(`/game/${gameId}/summary`);
  }

  function exitGame() {
    setShowExitConfirm(false);
    navigate('/home');
  }

  if (loading || !game) return <div className="stack">Loading game...</div>;

  const numberPadTitle =
    numberPadFor?.stage === 'thrower' ? 'Who threw the TD?' : numberPadFor?.stage === 'catcher' ? 'Who caught it?' : 'Enter player #';

  return (
    <div className="stack">
      <button onClick={() => setShowExitConfirm(true)} style={{ alignSelf: 'flex-start' }}>Exit</button>

      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <TeamLabel name={nameA} color="var(--color-team-a)" logo={teamA?.logo} />
          <span style={{ fontSize: 40, fontWeight: 700, lineHeight: 1, minWidth: 100, textAlign: 'center' }}>{scoreA} - {scoreB}</span>
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
          message="End the game? Final stats go to a team captain for review before they count."
          onConfirm={endGame}
          onCancel={() => setShowEndConfirm(false)}
        />
      )}

      {showExitConfirm && (
        <ConfirmDialog
          message="Exit this game? Everything so far is saved, but the MVP doesn't yet support resuming a game after you leave this screen."
          onConfirm={exitGame}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
    </div>
  );
}

function TeamLabel({ name, color, logo }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 100 }}>
      {logo ? (
        <img src={logo} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
      ) : (
        <span style={{ width: 20, height: 20, borderRadius: 4, background: color, display: 'inline-block' }} />
      )}
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
