import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPage } from './ui/Primitives';

const TeacherRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <LoadingPage />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'teacher') {
    return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }
  return children;
};

export default TeacherRoute;
