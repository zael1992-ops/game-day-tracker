import { Link } from 'react-router-dom';
import TeamLogo from './TeamLogo.jsx';

// Game card for Statistics, Games in progress and Pending review:
// [logo name]  score  [name logo], kickoff time under it, and optional
// actions (Resume / Abandon, Confirm / Reject) passed as children.
// Pass `to` to make the whole card a link.
export default function GameCard({ nameA, nameB, logoA, logoB, scoreA, scoreB, caption, to, children }) {
  const body = (
    <div className="game-card">
      <div className="game-card-row">
        <div className="game-card-team">
          <TeamLogo name={nameA} logo={logoA} side="A" size={40} />
          <strong className="game-card-name">{nameA}</strong>
        </div>
        <span className="game-card-score">{scoreA} - {scoreB}</span>
        <div className="game-card-team game-card-team-b">
          <strong className="game-card-name">{nameB}</strong>
          <TeamLogo name={nameB} logo={logoB} side="B" size={40} />
        </div>
      </div>
      {caption && <div className="game-card-caption">{caption}</div>}
      {children && <div className="game-card-extra">{children}</div>}
    </div>
  );

  if (!to) return body;
  return <Link to={to} className="game-card-link">{body}</Link>;
}
