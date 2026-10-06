// One-row scoreboard: [team] [score] - [score] [team], with team names
// under the color squares (or logos) and Local / Visitor under the
// scores. Never wraps, so double-digit scores stay on one line.
//
// onEditA / onEditB are optional: when passed, tapping that team opens
// the rename dialog. Registered teams don't get one.
export default function ScoreBox({ nameA, nameB, scoreA, scoreB, logoA, logoB, onEditA, onEditB }) {
  return (
    <div className="score-box">
      <TeamBlock name={nameA} logo={logoA} color="var(--color-team-a)" onEdit={onEditA} />
      <ScoreBlock score={scoreA} label="Local" />
      <span className="score-box-dash" aria-hidden="true">-</span>
      <ScoreBlock score={scoreB} label="Visitor" />
      <TeamBlock name={nameB} logo={logoB} color="var(--color-team-b)" onEdit={onEditB} />
    </div>
  );
}

function TeamBlock({ name, logo, color, onEdit }) {
  const content = (
    <>
      <span className="score-box-top">
        {logo ? (
          <img src={logo} alt="" className="score-box-logo" />
        ) : (
          <span className="score-box-swatch" style={{ background: color }} />
        )}
      </span>
      <strong className="score-box-name">{name}</strong>
    </>
  );

  if (onEdit) {
    return (
      <button type="button" className="score-box-team is-editable" onClick={onEdit} aria-label={`Rename ${name}`}>
        {content}
      </button>
    );
  }
  return <div className="score-box-team">{content}</div>;
}

function ScoreBlock({ score, label }) {
  return (
    <div className="score-box-score">
      <span className="score-box-top score-box-number">{score}</span>
      <span className="score-box-label">{label}</span>
    </div>
  );
}
