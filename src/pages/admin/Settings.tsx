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
    role: 'staff' as 'staff' | 'trainer',
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
    <div className="space-y-12 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">Manage staff and trainer accounts</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 bg-brand-primary text-white px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20"
        >
          <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
          Add Employee
        </button>
      </div>

      {/* Role Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-pastel-blue rounded-[2rem] p-6 border border-red-100/50 shadow-premium">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Staff</p>
          <p className="text-3xl font-black text-gray-900">{users.filter(u => u.role === 'staff').length}</p>
        </div>
        <div className="bg-pastel-emerald rounded-[2rem] p-6 border border-red-100/50 shadow-premium">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Trainers</p>
          <p className="text-3xl font-black text-gray-900">{users.filter(u => u.role === 'trainer').length}</p>
        </div>
      </div>

      <div className="space-y-12">
        {/* Pending Approvals */}
        {users.filter(u => !u.active && u.role !== 'admin' && u.role !== 'member').length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse shadow-sm shadow-amber-200" />
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Pending Approvals</h2>
            </div>
            <div className="bg-pastel-orange/20 rounded-[2.5rem] border border-orange-100/50 shadow-premium overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-orange-400/70 text-[10px] uppercase font-black tracking-[0.2em] border-b border-orange-100/30">
                    <th className="px-8 py-6 font-black">Employee</th>
                    <th className="px-8 py-6 font-black text-center">Role</th>
                    <th className="px-8 py-6 font-black">Contact</th>
                    <th className="px-8 py-6 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-orange-100/30">
                  {users.filter(u => !u.active && u.role !== 'admin' && u.role !== 'member').map((user) => (
                    <tr key={user.id} className="group hover:bg-white/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white bg-amber-400 shadow-sm transition-transform group-hover:scale-110">
                            {user.role === 'staff' ? 'S' : 'T'}
                          </div>
                          <div>
                            <p className="text-base font-black text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400 font-bold">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="px-4 py-2 bg-white rounded-xl text-[10px] font-black uppercase tracking-widest text-orange-500 border border-orange-100 shadow-sm">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-sm font-black text-gray-500">
                          <Phone className="w-4 h-4 text-orange-300" />
                          {user.phone}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleStatusUpdate(user.id, true)}
                            disabled={isProcessingStatus === user.id}
                            className="flex items-center gap-3 bg-red-500 text-white px-6 py-3 rounded-2xl text-xs font-black hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                          >
                            <UserCheck className="w-4 h-4" />
                            {isProcessingStatus === user.id ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('Are you sure you want to reject and delete this request?')) {
                                await db.collection('users').doc(user.id).delete();
                              }
                            }}
                            className="p-3 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
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
        <section className="space-y-6">
          <div className="flex items-center justify-between ml-2">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">All Employees</h2>
            <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {users.filter((u: any) => u.role !== 'member').length} Total
            </span>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-50/50">
                    <th className="px-8 py-6 font-black">Employee</th>
                    <th className="px-8 py-6 font-black text-center">Role</th>
                    <th className="px-8 py-6 font-black">Status</th>
                    <th className="px-8 py-6 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/50">
                  {users.filter(u => u.role !== 'member' && (u.active || u.role === 'admin')).map((user) => (
                    <tr key={user.id} className="group hover:bg-gray-50/30 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-sm transition-transform group-hover:scale-110 ${user.role === 'admin' ? 'bg-pastel-purple text-red-600 border border-red-100' :
                              user.role === 'staff' ? 'bg-red-500 text-white border border-red-200' :
                                'bg-red-500 text-white border border-red-200'
                            }`}>
                            {user.role === 'staff' ? 'S' : user.role === 'trainer' ? 'T' : user.name[0]}
                          </div>
                          <div>
                            <p className="text-base font-black text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400 font-bold">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-pastel-purple text-red-600' :
                            user.role === 'staff' ? 'bg-pastel-blue text-red-600' :
                              'bg-pastel-emerald text-red-600'
                          }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.active
                            ? 'bg-pastel-emerald text-red-500 border border-red-100'
                            : 'bg-pastel-pink text-pink-500 border border-pink-100'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-2 ${user.active ? 'bg-red-500' : 'bg-pink-500'}`}></span>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleStatusUpdate(user.id, !user.active)}
                            disabled={isProcessingStatus === user.id}
                            className={`p-3 rounded-2xl transition-all shadow-sm ${user.active
                                ? 'text-red-400 bg-red-50 hover:bg-red-100'
                                : 'text-red-500 bg-red-50 hover:bg-red-100'
                              } disabled:opacity-50 font-black text-xs uppercase tracking-tighter`}
                            title={user.active ? 'Suspend' : 'Activate'}
                          >
                            {isProcessingStatus === user.id ? (
                              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                            ) : (
                              user.active ? <LockPassword className="w-5 h-5" /> : <Shield className="w-5 h-5" />
                            )}
                          </button>
                          {user.role !== 'admin' && (
                            <button
                              onClick={async () => {
                                if (window.confirm('Permanently delete this user profile?')) {
                                  await db.collection('users').doc(user.id).delete();
                                }
                              }}
                              className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
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
              className="absolute inset-0 bg-black/30 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 40 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl p-10 border border-white/50"
            >
              <div className="mb-10 text-center">
                <div className="w-20 h-20 bg-pastel-emerald rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <UserPlus className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight tracking-tight">Add Employee</h2>
                <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Create a new employee account</p>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    placeholder="email@gympro.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                  >
                    <option value="staff">Staff (Reception)</option>
                    <option value="trainer">Trainer</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black text-sm hover:bg-gray-200 transition-all font-black"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="flex-2 py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50"
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
