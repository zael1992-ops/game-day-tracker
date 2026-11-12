import TeamLogo from './TeamLogo.jsx';

// Scoreboard. `compact` is the Live hub band between the two button
// panels: logos and the score only, since team names are right above and
// below it. The full version (Game summary, Watch page) adds names and
// Local / Visitor under each logo, plus optional content underneath
// (kickoff time, status chip).
export default function ScoreBox({ nameA, nameB, scoreA, scoreB, logoA, logoB, compact = false, children }) {
  if (compact) {
    return (
      <div className="score-band" aria-label={`${nameA} ${scoreA}, ${nameB} ${scoreB}`}>
        <TeamLogo name={nameA} logo={logoA} side="A" size={40} />
        <span className="score-band-score">{scoreA} - {scoreB}</span>
        <TeamLogo name={nameB} logo={logoB} side="B" size={40} />
      </div>
    );
  }

  return (
    <div className="score-card">
      <div className="score-card-row">
        <Team name={nameA} logo={logoA} side="A" label="Local" />
        <span className="score-card-score">{scoreA} - {scoreB}</span>
        <Team name={nameB} logo={logoB} side="B" label="Visitor" />
      </div>
      {children && <div className="score-card-extra">{children}</div>}
    </div>
  );
}

function Team({ name, logo, side, label }) {
  return (
    <div className="score-card-team">
      <TeamLogo name={name} logo={logo} side={side} size={52} />
      <strong className="score-card-name">{name}</strong>
      <span className="score-card-label">{label}</span>
    </div>
  );
}
