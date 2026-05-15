import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';
import { AdminDashboard } from './admin/AdminDashboard';
import { StaffDashboard } from './staff/StaffDashboard';
import { TrainerDashboard } from './trainer/TrainerDashboard';

export const Dashboard: React.FC = () => {
  const { isAdmin, isStaff, isTrainer, isMember } = useAuth();

  if (isMember) return <Navigate to="/my-dashboard" replace />;
  if (isAdmin) return <AdminDashboard />;
  if (isStaff) return <StaffDashboard />;
  if (isTrainer) return <TrainerDashboard />;
  return <div>Unauthorized access. Please contact administrator.</div>;
};
