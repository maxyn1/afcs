
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
  const { isAuthenticated, isAdmin, isDriver, isSaccoAdmin, isSystemAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based permissions
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireDriver && !isDriver) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSaccoAdmin && !isSaccoAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSystemAdmin && !isSystemAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
