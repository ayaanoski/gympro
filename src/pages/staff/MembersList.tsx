import React, { useEffect, useState } from 'react';
import { staffService } from '../../services/staffService';
import {
  Magnifer,
  UserPlus,
  Filter,
  MenuDots,
  ChatRoundDots,
  AltArrowRight,
  User,
  CloseCircle,
  AddCircle
} from '@solar-icons/react';
import { openWhatsApp, whatsAppTemplates } from '../../utils/whatsapp';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { adminService } from '../../services/adminService';

export const MembersList: React.FC = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    membership_plan: '',
    trainer_id: '',
    initial_payment: 0,
    payment_method: 'Cash',
    dob: ''
  });

  useEffect(() => {
    const unsubscribeMembers = staffService.getMembers(setMembers);
    const unsubscribePlans = adminService.getPlans(setPlans);
    const unsubscribeUsers = adminService.getUsers((users) => {
      setTrainers(users.filter(u => u.role === 'trainer' && u.active));
    });

    return () => {
      unsubscribeMembers();
      unsubscribePlans();
      unsubscribeUsers();
    };
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedPlan = plans.find(p => p.plan_name === formData.membership_plan);
      const selectedTrainer = trainers.find(t => t.id === formData.trainer_id);

      const expiryDate = new Date();
      if (selectedPlan) {
        if (selectedPlan.duration_unit === 'months') {
          expiryDate.setMonth(expiryDate.getMonth() + selectedPlan.duration);
        } else {
          expiryDate.setDate(expiryDate.getDate() + selectedPlan.duration);
        }
      }

      await staffService.addMember({
        ...formData,
        trainer_name: selectedTrainer?.name || 'Not Assigned',
        expiry_date: expiryDate.toISOString().split('T')[0],
        start_date: new Date().toISOString().split('T')[0]
      });

      // Send Welcome Message
      openWhatsApp(formData.phone, whatsAppTemplates.welcome(formData.name, formData.membership_plan, expiryDate.toISOString().split('T')[0]));

      setIsModalOpen(false);
      setFormData({ name: '', phone: '', email: '', membership_plan: '', trainer_id: '', initial_payment: 0, payment_method: 'Cash', dob: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.phone.includes(searchQuery) ||
      (m.member_id && m.member_id.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filter === 'all') return matchesSearch;
    return matchesSearch && m.status === filter;
  });

  return (
    <div className="space-y-10 pb-10 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Gym Members</h1>
          <p className="text-gray-500 mt-2 text-lg font-medium">Empower and track your athletic community</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-3 bg-brand-primary text-white px-8 py-4 rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20"
        >
          <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" />
          Add Member
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <Magnifer className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-brand-primary" />
          <input
            type="text"
            placeholder="Search by name, phone or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] shadow-premium focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-medium text-gray-600"
          />
        </div>
        <div className="flex bg-white p-1.5 rounded-[1.5rem] shadow-premium border border-gray-100">
          {['all', 'active', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-400 text-[10px] uppercase font-black tracking-[0.2em] border-b border-gray-50/50">
                <th className="px-8 py-6 font-black">Member</th>
                <th className="px-8 py-6 font-black">Plan</th>
                <th className="px-8 py-6 font-black">Expiry Date</th>
                <th className="px-8 py-6 font-black">Status</th>
                <th className="px-8 py-6 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50/50">
              {filteredMembers.length > 0 ? filteredMembers.map((member) => (
                <tr key={member.id} className="group hover:bg-gray-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <Link to={`/members/${member.id}`} className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-pastel-indigo rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white shadow-sm transition-transform group-hover:scale-110">
                        {member.photo ? (
                          <img src={member.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-brand-primary font-black text-lg">
                            {member.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-base font-black text-gray-900 group-hover:text-brand-primary transition-colors">{member.name}</p>
                        <p className="text-xs text-gray-400 font-bold tracking-tight">{member.phone}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-8 py-6 font-bold text-gray-600 text-sm">
                    <span className="px-3 py-1 bg-gray-50 rounded-lg border border-gray-100">{member.membership_plan}</span>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-gray-400">
                    {member.expiry_date}
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${member.status === 'active'
                      ? 'bg-pastel-emerald text-red-500 border border-red-100'
                      : 'bg-pastel-pink text-pink-500 border border-pink-100'
                      }`}>
                      <span className={`w-1.5 h-1.5 rounded-full mr-2 ${member.status === 'active' ? 'bg-red-500' : 'bg-pink-500'}`}></span>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => openWhatsApp(member.phone, whatsAppTemplates.checkIn(member.name))}
                        className="p-3 text-red-500 hover:bg-pastel-emerald/50 rounded-xl transition-all shadow-sm bg-white"
                        title="Direct Contact"
                      >
                        <ChatRoundDots className="w-5 h-5" />
                      </button>
                      <Link to={`/members/${member.id}`} className="p-3 text-gray-400 hover:text-brand-primary hover:bg-pastel-indigo rounded-xl transition-all shadow-sm bg-white">
                        <AltArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <User className="w-8 h-8 text-gray-200" />
                      </div>
                      <p className="text-gray-400 font-black text-lg">No members found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
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
              className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl p-10 overflow-y-auto max-h-[90vh] border border-white/50"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Register New Member</h2>
                  <p className="text-gray-400 font-bold mt-1 uppercase text-[10px] tracking-widest">Enrollment Details</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                  <CloseCircle className="w-8 h-8" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                    <input
                      type="text" required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="e.g. Rahul Sharma"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input
                      type="tel" required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                      placeholder="rahul@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date of Birth</label>
                    <input
                      type="date" required
                      value={formData.dob}
                      onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 uppercase"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Membership Plan</label>
                    <select
                      required
                      value={formData.membership_plan}
                      onChange={e => {
                        const plan = plans.find(p => p.plan_name === e.target.value);
                        setFormData({
                          ...formData,
                          membership_plan: e.target.value,
                          initial_payment: plan ? plan.price : 0
                        });
                      }}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                    >
                      <option value="">Select a plan</option>
                      {plans.map(p => (
                        <option key={p.id} value={p.plan_name}>{p.plan_name} - ₹{p.price}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Personal Trainer</label>
                    <select
                      value={formData.trainer_id}
                      onChange={e => setFormData({ ...formData, trainer_id: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                    >
                      <option value="">No Trainer</option>
                      {trainers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Fee (₹)</label>
                    <input
                      type="number" required readOnly
                      value={formData.initial_payment}
                      className="w-full px-6 py-4 bg-gray-100 border border-transparent rounded-2xl cursor-not-allowed font-bold text-gray-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                    <select
                      value={formData.payment_method}
                      onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                      className="w-full px-6 py-4 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-brand-primary/30 focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all font-bold text-gray-700 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1.25rem_center] bg-no-repeat"
                    >
                      <option value="Cash">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-[1.5rem] font-black text-sm hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-2 py-4 bg-brand-primary text-white rounded-[1.5rem] font-black text-sm hover:bg-brand-secondary transition-all shadow-xl shadow-brand-primary/20 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Register Member'}
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
