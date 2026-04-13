import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../shared/hooks/reduxHooks';
import { selectCurrentUser } from '../../features/auth/store/authSlice';
import React from 'react';

interface ProtectedRouteProps {
  allowedRoles?: Array<'ADMIN' | 'CUSTOMER'>;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const user = useAppSelector(selectCurrentUser);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
