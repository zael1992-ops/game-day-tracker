import { useNavigate } from 'react-router-dom';
import { BackIcon } from './Icons.jsx';

// Dark top bar used on every screen after the photo screens: an optional
// action on the left (usually the back arrow), the GDay wordmark in the
// middle, and an optional action on the right (Share live).
export default function GameHeader({ left, right }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-side">{left}</div>
        <span className="gday-mark" aria-label="GDay">
          <span>G</span><span className="gday-d">D</span><span>ay</span>
        </span>
        <div className="app-header-side app-header-side-right">{right}</div>
      </div>
    </header>
  );
}

// Back arrow for the header. Pass `to` for a plain link back, or
// `onClick` when leaving needs a confirmation first (Live hub).
export function BackButton({ to, onClick, label = 'Back' }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      className="icon-button"
      aria-label={label}
      onClick={onClick || (() => (to ? navigate(to) : navigate(-1)))}
    >
      <BackIcon />
    </button>
  );
}

export function HeaderAction({ children, onClick, active = false }) {
  return (
    <button type="button" className={`header-action${active ? ' is-on' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}
