import React, { useState } from 'react';
import { auth } from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { LockPassword, Download } from '@solar-icons/react';
import firebase from 'firebase/compat/app';
import { PwaInstallGuide } from '../../components/PwaInstallGuide';

export const MemberSettings: React.FC = () => {
  const { userProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPwaGuide, setShowPwaGuide] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user || !user.email) { setError('Not authenticated'); setLoading(false); return; }

      const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(credential);
      await user.updatePassword(newPassword);
      setMessage('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') setError('Current password is incorrect');
      else if (err.code === 'auth/weak-password') setError('New password is too weak');
      else setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-8 pb-10">
      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight">My Profile</h1>
        <p className="text-gray-500 mt-2 text-sm md:text-lg font-medium">Manage your account settings</p>
      </div>

      {/* Account Info */}
      <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium">
        <h3 className="text-lg font-black text-gray-900 tracking-tight mb-4">Account Info</h3>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Name</p>
            <p className="text-sm font-bold text-gray-900">{userProfile?.name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</p>
            <p className="text-sm font-bold text-gray-900">{userProfile?.email || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-gray-100 shadow-premium">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 md:p-3 bg-pastel-blue rounded-2xl border border-red-100">
            <LockPassword className="w-5 md:w-6 h-5 md:h-6 text-red-600" />
          </div>
          <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">Change Password</h3>
        </div>

        {message && (
          <div className="mb-6 p-4 bg-pastel-emerald border border-red-100 text-red-600 rounded-2xl text-sm font-bold">{message}</div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold">{error}</div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Current Password</label>
            <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">New Password</label>
            <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700" placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm New Password</label>
            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 md:px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700" placeholder="Repeat new password" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50">
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* PWA Install */}
      <button
        onClick={() => setShowPwaGuide(true)}
        className="w-full py-4 bg-gradient-to-r from-red-50 to-amber-50 border border-red-200/50 rounded-[1.5rem] font-black text-sm text-red-700 hover:from-red-100 hover:to-amber-100 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <Download className="w-5 h-5" />
        Install App — Android / iPhone / Desktop
      </button>

      <PwaInstallGuide open={showPwaGuide} onClose={() => setShowPwaGuide(false)} />
    </div>
  );
};
