import { useNavigate } from 'react-router-dom';
import { BackIcon } from './Icons.jsx';

// White back arrow in the top-left corner of the photo screens. The
// installed app runs full screen with no browser back button, so every
// photo screen past Welcome needs one.
export default function HeroBack({ to, label = 'Back' }) {
  const navigate = useNavigate();
  return (
    <button type="button" className="icon-button hero-back" aria-label={label} onClick={() => navigate(to)}>
      <BackIcon />
    </button>
  );
}
