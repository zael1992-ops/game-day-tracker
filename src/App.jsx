import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Welcome from './screens/Welcome.jsx';
import SignUp from './screens/SignUp.jsx';
import LogIn from './screens/LogIn.jsx';
import Home from './screens/Home.jsx';
import ManageTeams from './screens/ManageTeams.jsx';
import NewGame from './screens/NewGame.jsx';
import LiveHub from './screens/LiveHub.jsx';
import Summary from './screens/Summary.jsx';
import Stats from './screens/Stats.jsx';
import GuestGame from './screens/GuestGame.jsx';
import './styles/tokens.css';

// HashRouter is used so this can be hosted as a plain static build (no
// server-side rewrite rules needed). Swap to BrowserRouter later if you
// want clean URLs and your host supports rewriting all paths to index.html.
export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/guest/new" element={<GuestGame />} />

          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/teams" element={<ProtectedRoute><ManageTeams /></ProtectedRoute>} />
          <Route path="/game/new" element={<ProtectedRoute><NewGame /></ProtectedRoute>} />
          <Route path="/game/:gameId/live" element={<ProtectedRoute><LiveHub /></ProtectedRoute>} />
          <Route path="/game/:gameId/summary" element={<ProtectedRoute><Summary /></ProtectedRoute>} />
          <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
