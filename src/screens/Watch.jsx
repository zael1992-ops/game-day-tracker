import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedGame } from '../lib/dataStore.js';
import PlayByPlay from '../components/PlayByPlay.jsx';
import GameHeader from '../components/GameHeader.jsx';
import ScoreBox from '../components/ScoreBox.jsx';
import StatSheet from '../components/StatSheet.jsx';
import { tallyGame } from '../lib/statsHelpers.js';
import { formatKickoff } from '../lib/kickoff.js';

// Public, read-only spectator view. No login: everything comes through the
// get_shared_game() function (supabase/live_sharing.sql), which only answers
// for games whose owner turned sharing on.
//
// Updates by checking every few seconds while the game is live. Checking
// pauses when the tab is in the background and stops once the game ends.
const REFRESH_MS = 5000;

export default function Watch() {
  const { token } = useParams();
  const [game, setGame] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | unavailable | error
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getSharedGame(token);
      if (!data) {
        setState('unavailable');
        return;
      }
      setGame(data);
      setLastUpdated(new Date());
      setState('ready');
    } catch {
      // Keep showing the last good data if a refresh fails mid-game.
      setState((prev) => (prev === 'ready' ? 'ready' : 'error'));
    }
  }, [token]);

  const isLive = game?.status === 'active';

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (state !== 'ready' || !isLive) return undefined;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [state, isLive, load]);

  if (state === 'loading') {
    return (
      <div className="screen-light">
        <GameHeader />
        <p className="empty-state">Loading game...</p>
      </div>
    );
  }

  if (state === 'unavailable' || state === 'error') {
    return (
      <div className="screen-light">
        <GameHeader />
        <main className="page" style={{ textAlign: 'center', paddingTop: 48 }}>
          <h1 className="page-title">{state === 'error' ? 'Couldn\'t Load This Game' : 'This Game Isn\'t Being Shared'}</h1>
          <p className="muted">
            {state === 'error'
              ? 'Check your connection and try again.'
              : 'The link may have been turned off, or the game is no longer available.'}
          </p>
          {state === 'error' && <button type="button" className="btn btn-primary" onClick={load}>Try Again</button>}
        </main>
      </div>
    );
  }

  const scoreA = game.plays.filter((p) => p.side === 'A').reduce((s, p) => s + p.points, 0);
  const scoreB = game.plays.filter((p) => p.side === 'B').reduce((s, p) => s + p.points, 0);
  const kickoff = game.kickoffAt || game.createdAt;
  const tallyA = isLive ? [] : tallyGame(game.plays.filter((p) => p.side === 'A')).sort((a, b) => b.points - a.points);
  const tallyB = isLive ? [] : tallyGame(game.plays.filter((p) => p.side === 'B')).sort((a, b) => b.points - a.points);

  return (
    <div className="screen-light">
      <GameHeader />
      <main className="page">
        <ScoreBox nameA={game.teamAName} nameB={game.teamBName} scoreA={scoreA} scoreB={scoreB} logoA={game.teamALogo} logoB={game.teamBLogo}>
          {kickoff && <span>{formatKickoff(kickoff)}</span>}
          <span className={`chip ${isLive ? 'chip-red' : 'chip-dark'}`}>{isLive ? 'LIVE' : 'FINAL'}</span>
        </ScoreBox>

        {!isLive && (
          <>
            <h2 className="section-title">Stat Sheet</h2>
            <StatSheet nameA={game.teamAName} nameB={game.teamBName} rowsA={tallyA} rowsB={tallyB} />
          </>
        )}

        {isLive && lastUpdated && (
          <p className="muted small" style={{ textAlign: 'center' }}>
            Updates automatically. Last checked {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
          </p>
        )}

        <h2 className="section-title">Play by Play</h2>
        <PlayByPlay plays={game.plays} readOnly teamAName={game.teamAName} teamBName={game.teamBName} />
      </main>
    </div>
  );
}
