import GameHeader, { BackButton } from './GameHeader.jsx';
import BottomNav from './BottomNav.jsx';

// Light-screen layout: dark GDay header, centered title, content, and the
// bottom nav. Used by Teams, Statistics, the game lists and Game summary.
export default function AppScreen({ title, back = '/home', right, nav = true, navActive, children }) {
  return (
    <div className={`screen-light${nav ? ' has-nav' : ''}`}>
      <GameHeader left={back ? <BackButton to={back} /> : null} right={right} />
      <main className="page">
        {title && <h1 className="page-title">{title}</h1>}
        {children}
      </main>
      {nav && <BottomNav active={navActive} />}
    </div>
  );
}
