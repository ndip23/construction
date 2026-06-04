import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // 1. If not logged in at all, kick to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 1b. superadmin (platform owner) may enter any protected route.
  if (user?.role === 'superadmin') {
    return <>{children}</>;
  }

  // 2. If logged in but the role isn't allowed (e.g. Staff trying to see Finance)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their specific dashboard
    const redirectPath = user.role === 'staff' ? '/staff' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // 3. If everything is fine, show the page
  return <>{children}</>;
};
