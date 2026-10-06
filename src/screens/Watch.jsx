import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getSharedGame } from '../lib/dataStore.js';
import { describePlay } from '../components/PlayByPlay.jsx';

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

  if (state === 'loading') return <div className="stack">Loading game...</div>;

  if (state === 'unavailable' || state === 'error') {
    return (
      <div className="stack" style={{ textAlign: 'center', paddingTop: 48 }}>
        <h2 style={{ margin: 0 }}>{state === 'error' ? 'Couldn\'t load this game' : 'This game isn\'t being shared'}</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>
          {state === 'error'
            ? 'Check your connection and try again.'
            : 'The link may have been turned off, or the game is no longer available.'}
        </p>
        {state === 'error' && <button onClick={load}>Try again</button>}
      </div>
    );
  }

  const scoreA = game.plays.filter((p) => p.side === 'A').reduce((s, p) => s + p.points, 0);
  const scoreB = game.plays.filter((p) => p.side === 'B').reduce((s, p) => s + p.points, 0);
  const newestFirst = [...game.plays].sort((a, b) => b.sequence - a.sequence);

  return (
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

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '8px 0' }}>
        <Side name={game.teamAName} logo={game.teamALogo} color="var(--color-team-a)" />
        <span style={{ fontSize: 44, fontWeight: 700, lineHeight: 1, minWidth: 110, textAlign: 'center' }}>
          {scoreA} - {scoreB}
        </span>
        <Side name={game.teamBName} logo={game.teamBLogo} color="var(--color-team-b)" />
      </div>

      {isLive && lastUpdated && (
        <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
          Updates automatically. Last checked {lastUpdated.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
        </p>
      )}

      <h3 style={{ marginBottom: 0 }}>Play by play</h3>
      {newestFirst.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No plays yet.</p>
      ) : (
        <div className="stack" style={{ padding: 0 }}>
          {newestFirst.map((p) => (
            <div key={p.id} style={rowStyle}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  flexShrink: 0,
                  background: p.side === 'A' ? 'var(--color-team-a)' : 'var(--color-team-b)',
                }}
              />
              <span style={{ fontWeight: 600, flexShrink: 0 }}>{p.side === 'A' ? game.teamAName : game.teamBName}</span>
              <span>{describePlay(p)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Side({ name, logo, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 100 }}>
      {logo ? (
        <img src={logo} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
      ) : (
        <span style={{ width: 24, height: 24, borderRadius: 4, background: color, display: 'inline-block' }} />
      )}
      <strong style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.2, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name}
      </strong>
    </div>
  );
}

const rowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  padding: '8px 12px',
  fontSize: 14,
};
