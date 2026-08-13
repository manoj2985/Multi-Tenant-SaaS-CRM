import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-indigo-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">Verifying Authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl max-w-lg mx-auto mt-12 border border-slate-800">
        <h2 className="text-xl font-bold text-rose-400 mb-2">Access Denied (403 Forbidden)</h2>
        <p className="text-sm text-slate-400 mb-4">You do not have permission to view this section.</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <Outlet />;
}
