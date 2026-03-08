import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireAdmin = false
}) => {
  const { user, userProfile, isAdmin, isEmployeeActive, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isEmployeeActive) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-gray-100">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Pending Approval</h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Hi <strong>{userProfile?.name || 'there'}</strong>! Your account as a <strong>{userProfile?.role}</strong> is currently pending admin approval.
          </p>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-sm font-medium mb-8">
            Please contact the administrator to activate your account.
          </div>
          <button
            onClick={() => auth.signOut()}
            className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role) && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
