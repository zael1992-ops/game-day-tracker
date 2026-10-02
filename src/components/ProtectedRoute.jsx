import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

// Wraps any route that needs a real logged-in user. Bounces to /login
// if there's no session once the initial session check has finished.
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="stack">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
