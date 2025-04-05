import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireDriver?: boolean;
  requireSaccoAdmin?: boolean;
  requireSystemAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireDriver = false,
  requireSaccoAdmin = false,
  requireSystemAdmin = false
}) => {
  const { isAuthenticated, isAdmin, isDriver, isSaccoAdmin, isSystemAdmin, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireSystemAdmin && !isSystemAdmin) {
    return <Navigate to={authService.getRedirectPath(user?.role)} replace />;
  }

  if (requireDriver && !isDriver) {
    return <Navigate to={authService.getRedirectPath(user?.role)} replace />;
  }

  if (requireSaccoAdmin && !isSaccoAdmin) {
    return <Navigate to={authService.getRedirectPath(user?.role)} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to={authService.getRedirectPath(user?.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
