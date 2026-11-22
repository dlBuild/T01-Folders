import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authUrl } from '../utils/nav';
import Spinner from './Spinner';

/**
 * Logged-out visitors are sent to Login, remembering exactly where they wanted to go
 * (path + query + hash). After login/registration the Auth page sends them back there.
 */
export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner full />;
  if (!user) return <Navigate to={authUrl('login', location.pathname + location.search + location.hash)} replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
