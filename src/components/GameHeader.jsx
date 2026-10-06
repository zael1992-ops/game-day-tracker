import logo from '../assets/gd-logo.png';

// White top bar for game screens: optional action on the left (Exit),
// the GD logo centered, optional action on the right (Share live).
// Actions are plain bold text that turns mint while pressed.
export default function GameHeader({ left, right }) {
  return (
    <header className="game-header">
      <div className="game-header-inner">
        <div className="game-header-side">{left}</div>
        <img src={logo} alt="Game Day" className="game-header-logo" />
        <div className="game-header-side game-header-side-right">{right}</div>
      </div>
    </header>
  );
}

export function HeaderAction({ children, onClick, active = false }) {
  return (
    <button type="button" className={`header-action${active ? ' is-on' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
