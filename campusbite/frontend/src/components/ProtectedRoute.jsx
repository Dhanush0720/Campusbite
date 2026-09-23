import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Frontend gating is a UX convenience only - every real permission check happens
// again on the backend, which never trusts the client's idea of its own role.
const ProtectedRoute = ({ roles, children }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
