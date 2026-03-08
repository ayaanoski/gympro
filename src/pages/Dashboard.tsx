import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants';
import { AdminDashboard } from './admin/AdminDashboard';
import { StaffDashboard } from './staff/StaffDashboard';
import { TrainerDashboard } from './trainer/TrainerDashboard';
import { Layout } from '../components/Layout';

export const Dashboard: React.FC = () => {
  const { isAdmin, isStaff, isTrainer } = useAuth();

  if (isAdmin) return <AdminDashboard />;
  if (isStaff) return <StaffDashboard />;
  if (isTrainer) return <TrainerDashboard />;
  return <div>Unauthorized access. Please contact administrator.</div>;
};
