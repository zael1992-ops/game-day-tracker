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
import Dialog from '../components/Dialog.jsx';
import PlayByPlay from '../components/PlayByPlay.jsx';
import TeamPanel from '../components/TeamPanel.jsx';
import TdChooser from '../components/TdChooser.jsx';
import GameHeader, { HeaderAction, BackButton } from '../components/GameHeader.jsx';
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

  if (loading || !game) {
    return (
      <div className="screen-light">
        <GameHeader />
        <p className="empty-state">Loading game...</p>
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
      <GameHeader
        left={<BackButton label="Exit game" onClick={() => setShowExitConfirm(true)} />}
        right={
          <HeaderAction onClick={() => setShowShare(true)} active={Boolean(game.shareToken)}>
            {game.shareToken ? 'Sharing' : 'Share Live'}
          </HeaderAction>
        }
      />
      <main className="tracker-page">
        <TeamPanel
          side="A"
          name={nameA}
          logo={teamA?.logo}
          label="Local"
          onRename={teamA ? null : () => setRenamingSide('A')}
          {...panelHandlers('A')}
        />

        <ScoreBox compact nameA={nameA} nameB={nameB} scoreA={scoreA} scoreB={scoreB} logoA={teamA?.logo} logoB={teamB?.logo} />

        <TeamPanel
          side="B"
          name={nameB}
          logo={teamB?.logo}
          label="Visitor"
          onRename={teamB ? null : () => setRenamingSide('B')}
          {...panelHandlers('B')}
        />

        <button type="button" className="btn btn-danger-solid" style={{ marginTop: 8 }} onClick={() => setShowEndConfirm(true)}>
          End Game
        </button>

        <h2 className="section-title">Play by Play</h2>
        <PlayByPlay plays={plays} onUndo={handleUndo} namesA={namesA} namesB={namesB} teamAName={nameA} teamBName={nameB} />
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
          names={numberPadFor.side === 'A' ? namesA : namesB}
          teamName={numberPadFor.side === 'A' ? nameA : nameB}
          onSubmit={handleNumberSubmit}
          onCancel={() => setNumberPadFor(null)}
        />
      )}

      {showEndConfirm && (
        <ConfirmDialog
          title="End the Game?"
          message="Final stats go to a team captain for review before they count."
          cancelLabel="Keep Playing"
          confirmLabel="End Game"
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
          title="Exit the Game?"
          message="Everything is saved, and you can resume it from Home."
          cancelLabel="Stay"
          confirmLabel="Exit"
          danger={false}
          onConfirm={exitGame}
          onCancel={() => setShowExitConfirm(false)}
        />
      )}
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
    <Dialog title="Rename Team" body="Only changes the name for this game.">
      <input
        autoFocus
        className="field"
        aria-label="Team name"
        value={value}
        maxLength={MAX_TEAM_NAME}
        onChange={(e) => { setValue(e.target.value); setError(''); }}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
      />
      {error && <p className="error-text">{error}</p>}
      <div className="dialog-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </Dialog>
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
    <Dialog
      title="Share Live Game"
      body={
        shareToken
          ? 'Anyone with this link can watch the score and play by play. No account needed.'
          : "Create a link anyone can open to follow this game live. They'll see team names, the score, and plays by jersey number, but not player names or photos. You can turn it off any time."
      }
    >
      {shareToken ? (
        <>
          <div className="share-link">{link}</div>
          <button type="button" className="btn btn-primary" onClick={copyLink}>{copied ? 'Copied' : 'Copy Link'}</button>
          <button type="button" className="btn btn-danger" onClick={() => run(onStop)} disabled={busy}>Stop Sharing</button>
        </>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => run(onStart)} disabled={busy}>
          {busy ? 'Creating...' : 'Create Link'}
        </button>
      )}
      {error && <p className="error-text">{error}</p>}
      <button type="button" className="dialog-link" onClick={onClose}>Close</button>
    </Dialog>
  );
}
