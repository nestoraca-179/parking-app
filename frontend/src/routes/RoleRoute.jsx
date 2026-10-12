import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RoleRoute({ role }) {
  const { user } = useAuth();
  if (user?.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
