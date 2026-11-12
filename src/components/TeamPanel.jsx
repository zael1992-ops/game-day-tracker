import TeamLogo from './TeamLogo.jsx';
import { PencilIcon } from './Icons.jsx';

// One team's scoring buttons in the Live hub: team name on top, then
// Touchdown, then 1 pt / 2 pts / Safety, then Interception / Sack.
// Buttons are white cards with the label in the team's color.
// onRename is only passed for unsaved "Team 1" / "Team 2" sides.
export default function TeamPanel({ side, name, logo, label, onRename, onTd, onPat1, onPat2, onSafety, onInt, onSack }) {
  return (
    <section className={`tracker-panel side-${side.toLowerCase()}`} aria-label={`${name} scoring`}>
      <div className="tracker-team">
        <TeamLogo name={name} logo={logo} side={side} size={40} />
        <span className="tracker-team-name">{name}</span>
        <span className="tracker-team-label">{label}</span>
        {onRename && (
          <button type="button" className="icon-button icon-button-dark" onClick={onRename} aria-label={`Rename ${name}`}>
            <PencilIcon size={20} />
          </button>
        )}
      </div>
      <button type="button" className="tracker-btn tracker-btn-wide" onClick={onTd}>Touchdown</button>
      <div className="tracker-row tracker-row-3">
        <button type="button" className="tracker-btn" onClick={onPat1}>1 pt</button>
        <button type="button" className="tracker-btn" onClick={onPat2}>2 pts</button>
        <button type="button" className="tracker-btn" onClick={onSafety}>Safety</button>
      </div>
      <div className="tracker-row tracker-row-2">
        <button type="button" className="tracker-btn" onClick={onInt}>Interception</button>
        <button type="button" className="tracker-btn" onClick={onSack}>Sack</button>
      </div>
    </section>
  );
}
