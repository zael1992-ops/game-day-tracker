import { NavLink } from 'react-router-dom';
import { HomeIcon, TeamsIcon, StatsIcon, NewGameIcon } from './Icons.jsx';

const TABS = [
  { to: '/home', label: 'Home', Icon: HomeIcon },
  { to: '/teams', label: 'Teams', Icon: TeamsIcon },
  { to: '/stats', label: 'Statistics', Icon: StatsIcon },
  { to: '/game/new', label: 'New Game', Icon: NewGameIcon },
];

// Bottom tab bar on the light screens (Teams, Statistics, game lists,
// Game summary). Not shown during a game, so tracking stays focused.
// `active` forces a tab on for screens that aren't one of the four
// routes (Games in progress, Pending review and Game summary use Home).
export default function BottomNav({ active }) {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) => `bottom-nav-tab${isActive || active === to ? ' is-active' : ''}`}
        >
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
