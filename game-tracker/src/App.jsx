import { HashRouter, Routes, Route } from 'react-router-dom';
import Home from './screens/Home.jsx';
import ManageTeams from './screens/ManageTeams.jsx';
import NewGame from './screens/NewGame.jsx';
import LiveHub from './screens/LiveHub.jsx';
import Summary from './screens/Summary.jsx';
import Stats from './screens/Stats.jsx';
import './styles/tokens.css';

// HashRouter is used so this can be hosted as a plain static build (no
// server-side rewrite rules needed). Swap to BrowserRouter later if you
// want clean URLs and your host supports rewriting all paths to index.html.
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/teams" element={<ManageTeams />} />
        <Route path="/game/new" element={<NewGame />} />
        <Route path="/game/:gameId/live" element={<LiveHub />} />
        <Route path="/game/:gameId/summary" element={<Summary />} />
        <Route path="/stats" element={<Stats />} />
      </Routes>
    </HashRouter>
  );
}
