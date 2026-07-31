import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from './ui/Primitives';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <LoadingPage />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow students and parents
  if (user?.role === 'student' || user?.role === 'parent') {
    return children;
  }

  // Redirect admin
  if (user?.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Redirect teacher
  if (user?.role === 'teacher') {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  return <Navigate to="/login" replace />;
};

export default PrivateRoute;