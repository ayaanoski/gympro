import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Layout } from './components/Layout';
import { MembersList } from './pages/staff/MembersList';
import { MemberProfile } from './pages/shared/MemberProfile';
import { MembershipPlans } from './pages/admin/MembershipPlans';
import { Payments } from './pages/staff/Payments';
import { StaffAttendance } from './pages/staff/StaffAttendance';
import { Kiosk } from './pages/staff/Kiosk';
import { AttendanceLogs } from './pages/admin/AttendanceLogs';
import { Settings } from './pages/admin/Settings';
import { MemberDashboard } from './pages/member/MemberDashboard';
import { MemberSettings } from './pages/member/MemberSettings';
import { MemberAttendance } from './pages/member/MemberAttendance';
import { TrainerEarnings } from './pages/trainer/TrainerEarnings';
import { TrainerClients } from './pages/trainer/TrainerClients';
import { TrainerProfile } from './pages/trainer/TrainerProfile';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/members" element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <Layout><MembersList /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/members/:id" element={
            <ProtectedRoute allowedRoles={['admin', 'staff', 'trainer']}>
              <Layout><MemberProfile /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/plans" element={
            <ProtectedRoute requireAdmin>
              <Layout><MembershipPlans /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/payments" element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <Layout><Payments /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/attendance" element={
            <ProtectedRoute requireAdmin>
              <Layout><AttendanceLogs /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/staff-attendance" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <Layout><StaffAttendance /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/kiosk" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <Kiosk />
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute requireAdmin>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/my-dashboard" element={
            <ProtectedRoute allowedRoles={['member']}>
              <Layout><MemberDashboard /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/my-profile" element={
            <ProtectedRoute allowedRoles={['member']}>
              <Layout><MemberSettings /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/my-attendance" element={
            <ProtectedRoute allowedRoles={['member']}>
              <Layout><MemberAttendance /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/trainer-earnings" element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <Layout><TrainerEarnings /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/my-clients" element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <Layout><TrainerClients /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/trainer-profile" element={
            <ProtectedRoute allowedRoles={['trainer']}>
              <Layout><TrainerProfile /></Layout>
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
