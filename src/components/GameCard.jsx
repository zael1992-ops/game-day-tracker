import { Link } from 'react-router-dom';

// VS-style game card used on Statistics (confirmed games) and Games in
// progress. Pass `to` to make the whole card a link; pass children to
// add a footer (e.g. Resume / Abandon buttons).
export default function GameCard({ nameA, nameB, logoA, logoB, scoreA, scoreB, caption, to, children }) {
  const body = (
    <div style={{ border: '1px solid var(--color-text)', borderRadius: 'var(--radius)', padding: '16px 12px', background: 'var(--color-surface)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <Side name={nameA} logo={logoA} score={scoreA} color="var(--color-team-a)" />
        <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-text-muted)' }}>VS</span>
        <Side name={nameB} logo={logoB} score={scoreB} color="var(--color-team-b)" />
      </div>
      {caption && (
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)', marginTop: 12 }}>{caption}</div>
      )}
      {children && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  );

  if (!to) return body;
  return (
    <Link to={to} style={{ textDecoration: 'none', color: 'var(--color-text)' }}>
      {body}
    </Link>
  );
}

function Side({ name, logo, score, color }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 110 }}>
      {logo ? (
        <img src={logo} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
      ) : (
        <span style={{ width: 40, height: 40, borderRadius: 8, background: color, display: 'inline-block' }} />
      )}
      <strong style={{ fontSize: 13, textAlign: 'center', lineHeight: 1.2, width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {name}
      </strong>
      <span style={{ fontSize: 22, fontWeight: 700 }}>{score}</span>
    </div>
  );
}
