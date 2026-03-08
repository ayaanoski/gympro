import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import firebase from 'firebase/compat/app';
import { adminService } from '../../services/adminService';
import {
  UserPlus,
  Shield,
  UserCheck,
  UserCross,
  Letter,
  Phone,
  Settings as SettingsIcon,
  TrashBinTrash,
  LockPassword
} from '@solar-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import { ROLES } from '../../constants';

export const Settings: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'staff' as 'staff' | 'trainer' | 'admin',
    active: true
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessingStatus, setIsProcessingStatus] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = adminService.getUsers(setUsers);
    return () => unsubscribe();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    let secondaryApp;
    try {
      // Import firebaseConfig to initialize a secondary app (to avoid logging out admin)
      const { firebaseConfig } = await import('../../firebaseConfig');

      // Initialize a temporary app to create the user without affecting current auth state
      secondaryApp = firebase.initializeApp(firebaseConfig, `SecondaryApp_${Date.now()}`);

      const userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(formData.email, formData.password);
      const user = userCredential.user;

      if (user) {
        // Create user profile in Firestore using the main app's db
        await db.collection('users').doc(user.uid).set({
          uid: user.uid,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          active: formData.active,
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert(`Account created successfully for ${formData.name}!`);
      }

      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'staff', active: true });
    } catch (err: any) {
      console.error("Error creating user:", err);
      alert(err.message || "Failed to create user. Please check your permissions.");
    } finally {
      if (secondaryApp) await secondaryApp.delete();
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: boolean) => {
    if (!userId) return;
    setIsProcessingStatus(userId);
    try {
      await adminService.updateUserStatus(userId, newStatus);
    } catch (err: any) {
      console.error("Error updating status:", err);
      alert("Failed to update user status. " + (err.message || ""));
    } finally {
      setIsProcessingStatus(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage staff and trainer accounts</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
        >
          <UserPlus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Pending Approvals */}
        {users.filter(u => !u.active && u.role !== 'admin').length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-amber-600 flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              Pending Approvals
            </h2>
            <div className="bg-amber-50/30 rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <tbody className="divide-y divide-amber-100/50">
                  {users.filter(u => !u.active && u.role !== 'admin').map((user) => (
                    <tr key={user.id} className="hover:bg-amber-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white bg-amber-500`}>
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{user.role}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{user.phone}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(user.id, true)}
                            disabled={isProcessingStatus === user.id}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50"
                          >
                            <UserCheck className="w-4 h-4" /> {isProcessingStatus === user.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to reject and delete this request?')) {
                                await db.collection('users').doc(user.id).delete();
                              }
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            title="Reject & Delete"
                          >
                            <TrashBinTrash className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* User Management */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">All Employees</h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-50">
                    <th className="px-6 py-4 font-medium">Employee</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.filter(u => u.active || u.role === 'admin').map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${user.role === 'admin' ? 'bg-purple-500' : user.role === 'staff' ? 'bg-blue-500' : 'bg-emerald-500'
                            }`}>
                            {user.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                          user.role === 'staff' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${user.active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                          {user.active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusUpdate(user.id, !user.active)}
                            disabled={isProcessingStatus === user.id}
                            className={`p-2 rounded-xl transition-colors ${user.active ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                              } disabled:opacity-50`}
                            title={user.active ? 'Disable Account' : 'Enable Account'}
                          >
                            {isProcessingStatus === user.id ? (
                              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              user.active ? <UserCross className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />
                            )}
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={async () => {
                                if (window.confirm('Delete this user account?')) {
                                  await db.collection('users').doc(user.id).delete();
                                }
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                              <TrashBinTrash className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6">Add New Employee</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="john@gym.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="staff">Staff (Reception)</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Admin (Manager)</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-100 disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
