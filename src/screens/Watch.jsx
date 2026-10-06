import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedGame } from '../lib/dataStore.js';
import PlayByPlay from '../components/PlayByPlay.jsx';
import GameHeader from '../components/GameHeader.jsx';
import ScoreBox from '../components/ScoreBox.jsx';

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

  if (state === 'loading') return <><GameHeader /><div className="stack">Loading game...</div></>;

  if (state === 'unavailable' || state === 'error') {
    return (
      <>
      <GameHeader />
      <div className="stack" style={{ textAlign: 'center', paddingTop: 48 }}>
        <h2 style={{ margin: 0 }}>{state === 'error' ? 'Couldn\'t load this game' : 'This game isn\'t being shared'}</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {state === 'error'
            ? 'Check your connection and try again.'
            : 'The link may have been turned off, or the game is no longer available.'}
        </p>
        {state === 'error' && <button onClick={load}>Try again</button>}
      </div>
      </>
    );
  }

  const scoreA = game.plays.filter((p) => p.side === 'A').reduce((s, p) => s + p.points, 0);
  const scoreB = game.plays.filter((p) => p.side === 'B').reduce((s, p) => s + p.points, 0);

  return (
    <>
    <GameHeader />
    <div className="stack">
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 1,
            padding: '4px 12px',
            borderRadius: 999,
            background: isLive ? 'var(--color-team-b)' : 'var(--color-navy)',
            color: '#fff',
          }}
        >
          {isLive ? 'LIVE' : 'FINAL'}
        </span>
      </div>

      <ScoreBox
        nameA={game.teamAName}
        nameB={game.teamBName}
        scoreA={scoreA}
        scoreB={scoreB}
        logoA={game.teamALogo}
        logoB={game.teamBLogo}
      />

      {isLive && lastUpdated && (
        <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
          Updates automatically. Last checked {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
        </p>
      )}

      <h3 style={{ marginBottom: 0 }}>Play by play</h3>
      <PlayByPlay plays={game.plays} readOnly />
    </div>
    </>
  );
}
