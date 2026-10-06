import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getGame,
  listTeams,
  listPlays,
  listRosterSlots,
  insertPlay,
  undoPlay as undoPlayRemote,
  updateGameStatus,
  updateGameTeamName,
  enableGameSharing,
  disableGameSharing,
} from '../lib/dataStore.js';
import NumberPad from '../components/NumberPad.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PlayByPlay from '../components/PlayByPlay.jsx';
import TrackerButton from '../components/TrackerButton.jsx';
import GameHeader, { HeaderAction } from '../components/GameHeader.jsx';
import ScoreBox from '../components/ScoreBox.jsx';

export default function LiveHub() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [teamA, setTeamA] = useState(null);
  const [teamB, setTeamB] = useState(null);
  const [plays, setPlays] = useState([]);
  const [namesA, setNamesA] = useState({});
  const [namesB, setNamesB] = useState({});
  const [loading, setLoading] = useState(true);
  // { side, number } - set right after logging an interception, cleared
  // by any other play. Drives the conditional Pick-6 button.
  const [lastInterception, setLastInterception] = useState(null);

  const [tdChoiceSide, setTdChoiceSide] = useState(null);
  const [numberPadFor, setNumberPadFor] = useState(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // 'A' | 'B' while the rename dialog is open for an unregistered team
  const [renamingSide, setRenamingSide] = useState(null);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    (async () => {
      const [foundGame, foundPlays, teams] = await Promise.all([getGame(gameId), listPlays(gameId), listTeams()]);
      setGame(foundGame);
      setPlays(foundPlays);
      const foundTeamA = teams.find((t) => t.id === foundGame.teamAId) || null;
      const foundTeamB = teams.find((t) => t.id === foundGame.teamBId) || null;
      setTeamA(foundTeamA);
      setTeamB(foundTeamB);
      setLoading(false);

      // Player names for the play by play cards (registered teams only).
      const toNames = (slots) => Object.fromEntries(slots.filter((s) => s.personName).map((s) => [s.number, s.personName]));
      if (foundTeamA) listRosterSlots(foundTeamA.id).then((slots) => setNamesA(toNames(slots))).catch(() => {});
      if (foundTeamB) listRosterSlots(foundTeamB.id).then((slots) => setNamesB(toNames(slots))).catch(() => {});
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

  async function saveTeamName(side, newName) {
    await updateGameTeamName(gameId, side, newName);
    setGame((prev) => ({ ...prev, [side === 'A' ? 'teamAName' : 'teamBName']: newName }));
    setRenamingSide(null);
  }

  async function startSharing() {
    const token = await enableGameSharing(gameId);
    setGame((prev) => ({ ...prev, shareToken: token }));
  }

  async function stopSharing() {
    await disableGameSharing(gameId);
    setGame((prev) => ({ ...prev, shareToken: null }));
  }

  function exitGame() {
    setShowExitConfirm(false);
    navigate('/home');
  }

  if (loading || !game) return <div className="stack">Loading game...</div>;

  const numberPadTitle =
    numberPadFor?.stage === 'thrower' ? 'Who threw the TD?' : numberPadFor?.stage === 'catcher' ? 'Who caught it?' : 'Enter player #';

  return (
    <>
      <GameHeader
        left={<HeaderAction onClick={() => setShowExitConfirm(true)}>Exit</HeaderAction>}
        right={
          <HeaderAction onClick={() => setShowShare(true)} active={Boolean(game.shareToken)}>
            {game.shareToken ? 'Sharing live' : 'Share live'}
          </HeaderAction>
        }
      />
    <div className="stack">
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

      <ScoreBox
        nameA={nameA}
        nameB={nameB}
        scoreA={scoreA}
        scoreB={scoreB}
        logoA={teamA?.logo}
        logoB={teamB?.logo}
        onEditA={teamA ? null : () => setRenamingSide('A')}
        onEditB={teamB ? null : () => setRenamingSide('B')}
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
      <PlayByPlay plays={plays} onUndo={handleUndo} namesA={namesA} namesB={namesB} />

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

      {renamingSide && (
        <RenameTeamDialog
          initialName={renamingSide === 'A' ? nameA : nameB}
          onSave={(newName) => saveTeamName(renamingSide, newName)}
          onCancel={() => setRenamingSide(null)}
        />
      )}

      {showShare && (
        <ShareDialog
          shareToken={game.shareToken}
          onStart={startSharing}
          onStop={stopSharing}
          onClose={() => setShowShare(false)}
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
    </>
  );
}

function TeamPanel({ name, color, onTd, onPat1, onPat2, onSafety, onInt, onSack }) {
  return (
    <div className="stack" style={{ padding: 0, width: '100%' }}>
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

const MAX_TEAM_NAME = 30;

function RenameTeamDialog({ initialName, onSave, onCancel }) {
  const [value, setValue] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const trimmed = value.trim();

  async function handleSave() {
    if (!trimmed) {
      setError('Team name can\'t be empty.');
      return;
    }
    setSaving(true);
    try {
      await onSave(trimmed);
    } catch {
      setError('Couldn\'t save the name. Check your connection and try again.');
      setSaving(false);
    }
  }

  return (
    <div style={overlayStyle}>
      <div className="stack" style={modalStyle}>
        <h3 style={{ margin: 0 }}>Rename team</h3>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)' }}>
          Only changes the name for this game.
        </p>
        <input
          autoFocus
          value={value}
          maxLength={MAX_TEAM_NAME}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
          style={{ padding: '10px 12px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', fontSize: 16 }}
        />
        {error && <p style={{ margin: 0, color: 'var(--color-danger)', fontSize: 14 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1 }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function ShareDialog({ shareToken, onStart, onStop, onClose }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  // HashRouter: the watch page lives after the #, on the same domain.
  const link = shareToken ? `${window.location.origin}${window.location.pathname}#/watch/${shareToken}` : '';

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    }
    setBusy(false);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Couldn\'t copy automatically. Press and hold the link to copy it.');
    }
  }

  return (
    <div style={overlayStyle}>
      <div className="stack" style={modalStyle}>
        <h3 style={{ margin: 0 }}>Share live game</h3>
        {shareToken ? (
          <>
            <p style={{ margin: 0, fontSize: 14 }}>
              Anyone with this link can watch the score and play by play. No account needed.
            </p>
            <div style={{ wordBreak: 'break-all', fontSize: 13, padding: 10, border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', userSelect: 'all' }}>
              {link}
            </div>
            <button onClick={copyLink}>{copied ? 'Copied' : 'Copy link'}</button>
            <button onClick={() => run(onStop)} disabled={busy} style={{ color: 'var(--color-danger)' }}>
              Stop sharing
            </button>
          </>
        ) : (
          <>
            <p style={{ margin: 0, fontSize: 14 }}>
              Create a link anyone can open to follow this game live. They'll see team names, the score, and plays by jersey number,
              but not player names or photos. You can turn it off any time.
            </p>
            <button onClick={() => run(onStart)} disabled={busy}>{busy ? 'Creating...' : 'Create link'}</button>
          </>
        )}
        {error && <p style={{ margin: 0, color: 'var(--color-danger)', fontSize: 14 }}>{error}</p>}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 16,
  zIndex: 10,
};

const modalStyle = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius)',
  width: '100%',
  maxWidth: 340,
};
